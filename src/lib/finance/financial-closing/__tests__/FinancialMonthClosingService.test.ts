import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinancialMonthClosingService, NotReadyToCloseError } from "../FinancialMonthClosingService";
import { FinancialMonthStatus } from "../FinancialMonthStatus";
import { ChecklistItemStatus } from "../ChecklistItemStatus";
import { RequiredStatementType } from "../RequiredStatementType";
import { ClosingConversationEventMapper } from "../ClosingConversationEventMapper";
import { FinancialClosingNotifier } from "../FinancialClosingNotifier";
import { NullConversationResponder } from "../../conversation";
import type { IFinancialMonthRepository } from "../IFinancialMonthRepository";
import type { IStatementRequirementRepository } from "../IStatementRequirementRepository";
import type { FinancialMonth } from "../FinancialMonth";
import type { StatementRequirement } from "../StatementRequirement";
import type { IDebtRepository } from "../../debt/IDebtRepository";
import type { Debt } from "../../debt/Debt";
import type { IFinancialStateService } from "../../pipeline/IFinancialStateService";
import type { PipelineResult } from "../../pipeline/PipelineResult";
import { makeFinancialMonth, makeChecklistItem, makeStatementRequirement, makeFakePipelineResult } from "./testHelpers";

class FakeMonthRepo implements IFinancialMonthRepository {
  months = new Map<string, FinancialMonth>();
  private nextId = 1;

  async findByPeriod(userId: string, year: number, month: number) {
    return [...this.months.values()].find(m => m.userId === userId && m.year === year && m.month === month) ?? null;
  }

  async create(userId: string, year: number, month: number, periodLabel: string, requirementIds: ReadonlyArray<string>) {
    const created = makeFinancialMonth({
      id: `month-${this.nextId++}`,
      userId,
      year,
      month,
      periodLabel,
      checklistItems: requirementIds.map((requirementId, i) => makeChecklistItem({ id: `item-${i}`, requirementId })),
    });
    this.months.set(created.id, created);
    return created;
  }

  async findById(userId: string, monthId: string) {
    const found = this.months.get(monthId);
    return found && found.userId === userId ? found : null;
  }

  async findLatestClosed(userId: string) {
    return (
      [...this.months.values()]
        .filter(m => m.userId === userId && m.status === FinancialMonthStatus.CLOSED)
        .sort((a, b) => (b.closedAt?.getTime() ?? 0) - (a.closedAt?.getTime() ?? 0))[0] ?? null
    );
  }

  async save(month: FinancialMonth) {
    this.months.set(month.id, month);
    return month;
  }
}

class FakeRequirementRepo implements IStatementRequirementRepository {
  requirements: StatementRequirement[] = [];
  private nextId = 1;

  async listActive(userId: string) {
    return this.requirements.filter(r => r.userId === userId && r.isActive);
  }

  async create(requirement: Omit<StatementRequirement, "id">) {
    const created: StatementRequirement = { ...requirement, id: `req-${this.nextId++}` };
    this.requirements.push(created);
    return created;
  }

  async deactivate(userId: string, requirementId: string) {
    this.requirements = this.requirements.map(r =>
      r.id === requirementId && r.userId === userId ? { ...r, isActive: false } : r,
    );
  }

  async findByLinkedDebt(userId: string, debtId: string) {
    return this.requirements.find(r => r.userId === userId && r.linkedDebtId === debtId) ?? null;
  }
}

class FakeDebtRepo implements IDebtRepository {
  constructor(private readonly debts: ReadonlyArray<Debt>) {}
  async findByUser() { return this.debts; }
  async findActive() { return this.debts; }
  async findByStatus() { return this.debts; }
  async findById(_userId: string, debtId: string) { return this.debts.find(d => d.id === debtId) ?? null; }
}

function makeFakeStateService(): IFinancialStateService {
  return {
    getPipelineResult: vi.fn(async () => makeFakePipelineResult() as unknown as PipelineResult),
    getLatestReview: vi.fn(),
    getConversationInput: vi.fn(),
  };
}

function makeService(opts: { monthRepo?: FakeMonthRepo; requirementRepo?: FakeRequirementRepo; debts?: Debt[] } = {}) {
  const monthRepo = opts.monthRepo ?? new FakeMonthRepo();
  const requirementRepo = opts.requirementRepo ?? new FakeRequirementRepo();
  const debtRepo = new FakeDebtRepo(opts.debts ?? []);
  const stateService = makeFakeStateService();
  const notifier = new FinancialClosingNotifier(new ClosingConversationEventMapper(), new NullConversationResponder(), null);
  const notifySpy = vi.spyOn(notifier, "notify");

  const service = new FinancialMonthClosingService(monthRepo, requirementRepo, debtRepo, stateService, notifier);
  return { service, monthRepo, requirementRepo, notifySpy };
}

beforeEach(() => vi.clearAllMocks());

describe("FinancialMonthClosingService.getOrCreateCurrentMonth() / getOrCreateMonth()", () => {
  it("creates a new month with one PENDING checklist item per active requirement", async () => {
    const requirementRepo = new FakeRequirementRepo();
    requirementRepo.requirements.push(makeStatementRequirement({ id: "req-1" }));
    const { service } = makeService({ requirementRepo });

    const month = await service.getOrCreateMonth("u1", 2026, 7);

    expect(month.checklistItems).toHaveLength(1);
    expect(month.checklistItems[0]!.status).toBe(ChecklistItemStatus.PENDING);
    expect(month.status).toBe(FinancialMonthStatus.OPEN);
  });

  it("returns the existing month on a second call instead of creating a duplicate", async () => {
    const { service, monthRepo } = makeService();

    const first = await service.getOrCreateMonth("u1", 2026, 7);
    const second = await service.getOrCreateMonth("u1", 2026, 7);

    expect(second.id).toBe(first.id);
    expect(monthRepo.months.size).toBe(1);
  });
});

describe("FinancialMonthClosingService.confirmSalary()", () => {
  it("sets salaryConfirmed and always fires a SALARY_CONFIRMED notification", async () => {
    const { service, monthRepo, notifySpy } = makeService();
    const month = await service.getOrCreateMonth("u1", 2026, 7);

    const updated = await service.confirmSalary("u1", month.id);

    expect(updated.salaryConfirmed).toBe(true);
    expect(updated.salaryConfirmedAt).not.toBeNull();
    expect(monthRepo.months.get(month.id)!.salaryConfirmed).toBe(true);
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ kind: "SALARY_CONFIRMED" }));
  });

  it("also fires MONTH_READY_TO_CLOSE when confirming salary is the last missing piece", async () => {
    const requirementRepo = new FakeRequirementRepo();
    requirementRepo.requirements.push(makeStatementRequirement({ id: "req-1" }));
    const { service, notifySpy } = makeService({ requirementRepo });

    const month = await service.getOrCreateMonth("u1", 2026, 7);
    await service.linkUpload("u1", month.id, month.checklistItems[0]!.id, "upload-1");
    notifySpy.mockClear();

    const updated = await service.confirmSalary("u1", month.id);

    expect(updated.status).toBe(FinancialMonthStatus.READY_TO_CLOSE);
    const kinds = notifySpy.mock.calls.map(([event]) => event.kind);
    expect(kinds).toContain("SALARY_CONFIRMED");
    expect(kinds).toContain("MONTH_READY_TO_CLOSE");
  });
});

describe("FinancialMonthClosingService.linkUpload()", () => {
  it("marks the checklist item SATISFIED and recomputes status", async () => {
    const requirementRepo = new FakeRequirementRepo();
    requirementRepo.requirements.push(makeStatementRequirement({ id: "req-1" }));
    const { service } = makeService({ requirementRepo });
    const month = await service.getOrCreateMonth("u1", 2026, 7);
    const itemId = month.checklistItems[0]!.id;

    const updated = await service.linkUpload("u1", month.id, itemId, "upload-1");

    const item = updated.checklistItems.find(i => i.id === itemId)!;
    expect(item.status).toBe(ChecklistItemStatus.SATISFIED);
    expect(item.matchedStatementUploadId).toBe("upload-1");
    expect(updated.status).toBe(FinancialMonthStatus.COLLECTING_DATA);
  });

  it("throws when the checklist item doesn't belong to the month", async () => {
    const { service } = makeService();
    const month = await service.getOrCreateMonth("u1", 2026, 7);

    await expect(service.linkUpload("u1", month.id, "nonexistent", "upload-1")).rejects.toThrow();
  });
});

describe("FinancialMonthClosingService.closeMonth()", () => {
  it("throws NotReadyToCloseError when the month isn't READY_TO_CLOSE", async () => {
    const { service } = makeService();
    const month = await service.getOrCreateMonth("u1", 2026, 7);

    await expect(service.closeMonth("u1", month.id)).rejects.toBeInstanceOf(NotReadyToCloseError);
  });

  it("closes the month, pins a closingSnapshot, and fires MONTH_CLOSED", async () => {
    const { service, notifySpy } = makeService();
    const month = await service.getOrCreateMonth("u1", 2026, 7);
    await service.confirmSalary("u1", month.id); // zero requirements -> vacuously ready

    const closed = await service.closeMonth("u1", month.id);

    expect(closed.status).toBe(FinancialMonthStatus.CLOSED);
    expect(closed.closingSnapshot).not.toBeNull();
    expect(closed.closingSnapshot!.pipelineVersion).toBeTruthy();
    expect(closed.closedAt).not.toBeNull();
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ kind: "MONTH_CLOSED" }));
  });
});

describe("FinancialMonthClosingService.reopenMonth()", () => {
  it("reverts a CLOSED month to COLLECTING_DATA and clears the snapshot", async () => {
    const { service } = makeService();
    const month = await service.getOrCreateMonth("u1", 2026, 7);
    await service.confirmSalary("u1", month.id);
    const closed = await service.closeMonth("u1", month.id);

    const reopened = await service.reopenMonth("u1", closed.id);

    expect(reopened.status).toBe(FinancialMonthStatus.COLLECTING_DATA);
    expect(reopened.closingSnapshot).toBeNull();
    expect(reopened.closedAt).toBeNull();
  });
});

describe("FinancialMonthClosingService.syncDebtRequirements()", () => {
  it("creates a LOAN requirement for each active debt not already tracked", async () => {
    const debt = { id: "debt-1", lender: "HDFC Bank", name: "Home Loan" } as Debt;
    const { service, requirementRepo } = makeService({ debts: [debt] });

    const result = await service.syncDebtRequirements("u1");

    expect(result).toHaveLength(1);
    expect(result[0]!.statementType).toBe(RequiredStatementType.LOAN);
    expect(result[0]!.linkedDebtId).toBe("debt-1");
    expect(result[0]!.autoManaged).toBe(true);
    expect(requirementRepo.requirements).toHaveLength(1);
  });

  it("does not duplicate a requirement for a debt already tracked", async () => {
    const debt = { id: "debt-1", lender: "HDFC Bank", name: "Home Loan" } as Debt;
    const requirementRepo = new FakeRequirementRepo();
    requirementRepo.requirements.push(
      makeStatementRequirement({ id: "req-1", linkedDebtId: "debt-1", autoManaged: true, statementType: RequiredStatementType.LOAN }),
    );
    const { service } = makeService({ requirementRepo, debts: [debt] });

    const result = await service.syncDebtRequirements("u1");

    expect(result).toHaveLength(1);
    expect(requirementRepo.requirements).toHaveLength(1);
  });

  it("deactivates an auto-managed requirement whose debt is no longer active", async () => {
    const requirementRepo = new FakeRequirementRepo();
    requirementRepo.requirements.push(
      makeStatementRequirement({ id: "req-1", linkedDebtId: "debt-gone", autoManaged: true, statementType: RequiredStatementType.LOAN }),
    );
    const { service, requirementRepo: repo } = makeService({ requirementRepo, debts: [] });

    await service.syncDebtRequirements("u1");

    expect(repo.requirements.find(r => r.id === "req-1")!.isActive).toBe(false);
  });

  it("never touches a manually configured (non-autoManaged) requirement", async () => {
    const requirementRepo = new FakeRequirementRepo();
    requirementRepo.requirements.push(
      makeStatementRequirement({ id: "req-1", linkedDebtId: null, autoManaged: false, statementType: RequiredStatementType.BANK }),
    );
    const { service, requirementRepo: repo } = makeService({ requirementRepo, debts: [] });

    await service.syncDebtRequirements("u1");

    expect(repo.requirements.find(r => r.id === "req-1")!.isActive).toBe(true);
  });
});
