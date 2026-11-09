import type { IFinancialMonthRepository } from "./IFinancialMonthRepository";
import type { IStatementRequirementRepository } from "./IStatementRequirementRepository";
import type { IDebtRepository } from "../debt/IDebtRepository";
import type { IFinancialStateService } from "../pipeline/IFinancialStateService";
import type { FinancialMonth } from "./FinancialMonth";
import type { ChecklistItem } from "./ChecklistItem";
import type { StatementRequirement } from "./StatementRequirement";
import { FinancialMonthStatus } from "./FinancialMonthStatus";
import { ChecklistItemStatus } from "./ChecklistItemStatus";
import { RequiredStatementType } from "./RequiredStatementType";
import { StatementMatcher, type UploadMatchCandidate } from "./StatementMatcher";
import { ClosingReadinessEvaluator } from "./ClosingReadinessEvaluator";
import { buildClosingSnapshot } from "./ClosingSnapshot";
import type { FinancialClosingNotifier } from "./FinancialClosingNotifier";
import { APP_VERSION } from "../../version";

/** Thrown by closeMonth() when the month isn't READY_TO_CLOSE — callers (API
 * routes) catch this to render a 409 with the missing items, mirroring the
 * existing AI_DISABLED carve-out pattern elsewhere in this codebase. */
export class NotReadyToCloseError extends Error {
  constructor(public readonly month: FinancialMonth) {
    super(`FinancialMonth ${month.id} is not READY_TO_CLOSE (current status: ${month.status})`);
  }
}

/**
 * Orchestrator for the monthly closing lifecycle. Pure orchestration/state —
 * never recomputes a financial figure; closeMonth() pulls the already-computed
 * PipelineResult from FinancialStateService and pins it, it doesn't run the
 * pipeline itself. See ADR-021.
 */
export class FinancialMonthClosingService {
  private readonly matcher = new StatementMatcher();
  private readonly evaluator = new ClosingReadinessEvaluator();

  constructor(
    private readonly monthRepo: IFinancialMonthRepository,
    private readonly requirementRepo: IStatementRequirementRepository,
    private readonly debtRepo: IDebtRepository,
    private readonly stateService: IFinancialStateService,
    private readonly notifier: FinancialClosingNotifier,
  ) {}

  async getOrCreateCurrentMonth(userId: string): Promise<FinancialMonth> {
    const now = new Date();
    return this.getOrCreateMonth(userId, now.getFullYear(), now.getMonth() + 1);
  }

  async getMonth(userId: string, monthId: string): Promise<FinancialMonth | null> {
    return this.monthRepo.findById(userId, monthId);
  }

  async getLatestClosedMonth(userId: string): Promise<FinancialMonth | null> {
    return this.monthRepo.findLatestClosed(userId);
  }

  async getOrCreateMonth(userId: string, year: number, month: number): Promise<FinancialMonth> {
    const existing = await this.monthRepo.findByPeriod(userId, year, month);
    if (existing) return existing;

    const requirements = await this.requirementRepo.listActive(userId);
    const periodLabel = `${year}-${String(month).padStart(2, "0")}`;
    return this.monthRepo.create(userId, year, month, periodLabel, requirements.map(r => r.id));
  }

  async confirmSalary(userId: string, monthId: string): Promise<FinancialMonth> {
    const month = await this.requireMonth(userId, monthId);
    const withSalary: FinancialMonth = { ...month, salaryConfirmed: true, salaryConfirmedAt: new Date() };
    const saved = await this.recompute(userId, withSalary);

    await this.notifier.notify({
      kind: "SALARY_CONFIRMED",
      userId,
      monthId: saved.id,
      periodLabel: saved.periodLabel,
    });
    return saved;
  }

  suggestMatchForUpload(month: FinancialMonth, upload: UploadMatchCandidate): ChecklistItem | null {
    return this.matcher.suggestMatch(upload, month.checklistItems);
  }

  async linkUpload(userId: string, monthId: string, itemId: string, statementUploadId: string): Promise<FinancialMonth> {
    const month = await this.requireMonth(userId, monthId);
    if (!month.checklistItems.some(i => i.id === itemId)) {
      throw new Error(`Checklist item ${itemId} not found on FinancialMonth ${monthId}`);
    }

    const updatedItems = month.checklistItems.map(i =>
      i.id === itemId
        ? { ...i, status: ChecklistItemStatus.SATISFIED, matchedStatementUploadId: statementUploadId, satisfiedAt: new Date() }
        : i,
    );
    return this.recompute(userId, { ...month, checklistItems: updatedItems });
  }

  async notifyMissingStatements(userId: string, monthId: string): Promise<void> {
    const month = await this.requireMonth(userId, monthId);
    const missing = month.checklistItems.filter(i => i.status === ChecklistItemStatus.PENDING);
    if (missing.length === 0) return;

    await this.notifier.notify({
      kind: "STATEMENT_MISSING",
      userId,
      monthId: month.id,
      periodLabel: month.periodLabel,
      missingLabels: missing.map(i => i.label),
    });
  }

  async closeMonth(userId: string, monthId: string): Promise<FinancialMonth> {
    const month = await this.requireMonth(userId, monthId);
    if (month.status !== FinancialMonthStatus.READY_TO_CLOSE) {
      throw new NotReadyToCloseError(month);
    }

    const pipelineResult = await this.stateService.getPipelineResult(userId);
    const snapshot = buildClosingSnapshot(pipelineResult, APP_VERSION);

    const saved = await this.monthRepo.save({
      ...month,
      status: FinancialMonthStatus.CLOSED,
      closingSnapshot: snapshot,
      closedAt: new Date(),
    });

    await this.notifier.notify({
      kind: "MONTH_CLOSED",
      userId,
      monthId: saved.id,
      periodLabel: saved.periodLabel,
    });
    return saved;
  }

  /** Debug/admin-only — gated by the caller (route checks ENABLE_MONTH_REOPEN),
   * not by this service. Reverts to COLLECTING_DATA so the next recompute
   * re-derives whichever status the checklist/salary state actually supports. */
  async reopenMonth(userId: string, monthId: string): Promise<FinancialMonth> {
    const month = await this.requireMonth(userId, monthId);
    return this.monthRepo.save({
      ...month,
      status: FinancialMonthStatus.COLLECTING_DATA,
      closingSnapshot: null,
      closedAt: null,
    });
  }

  /** Re-derives loan requirements from currently active Debt records —
   * explicit, on-demand (no background sync; no cron infra exists in this
   * codebase). Creates a requirement for any active debt not yet tracked,
   * and deactivates any auto-managed requirement whose debt is no longer
   * active. Bank/credit-card/investment requirements are never touched here
   * — they have no linkedDebtId and stay manually managed. */
  async syncDebtRequirements(userId: string): Promise<ReadonlyArray<StatementRequirement>> {
    const [activeDebts, existing] = await Promise.all([
      this.debtRepo.findActive(userId),
      this.requirementRepo.listActive(userId),
    ]);

    const existingByDebtId = new Map(
      existing.filter(r => r.linkedDebtId !== null).map(r => [r.linkedDebtId as string, r]),
    );
    const activeDebtIds = new Set(activeDebts.map(d => d.id));

    const result: StatementRequirement[] = [];
    for (const debt of activeDebts) {
      const already = existingByDebtId.get(debt.id);
      if (already) {
        result.push(already);
        continue;
      }
      result.push(
        await this.requirementRepo.create({
          userId,
          label: `${debt.lender} — ${debt.name}`,
          statementType: RequiredStatementType.LOAN,
          linkedDebtId: debt.id,
          autoManaged: true,
          isActive: true,
        }),
      );
    }

    for (const req of existing) {
      if (req.autoManaged && req.linkedDebtId && !activeDebtIds.has(req.linkedDebtId)) {
        await this.requirementRepo.deactivate(userId, req.id);
      }
    }

    return result;
  }

  private async recompute(userId: string, month: FinancialMonth): Promise<FinancialMonth> {
    const previousStatus = month.status;
    const nextStatus = this.evaluator.nextStatus(month);
    const saved = await this.monthRepo.save({ ...month, status: nextStatus });

    if (nextStatus === FinancialMonthStatus.READY_TO_CLOSE && previousStatus !== FinancialMonthStatus.READY_TO_CLOSE) {
      await this.notifier.notify({
        kind: "MONTH_READY_TO_CLOSE",
        userId,
        monthId: saved.id,
        periodLabel: saved.periodLabel,
      });
    }
    return saved;
  }

  private async requireMonth(userId: string, monthId: string): Promise<FinancialMonth> {
    const month = await this.monthRepo.findById(userId, monthId);
    if (!month) throw new Error(`FinancialMonth ${monthId} not found for user`);
    return month;
  }
}
