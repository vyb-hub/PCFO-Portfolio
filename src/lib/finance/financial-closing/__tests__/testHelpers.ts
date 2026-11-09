import type { FinancialMonth } from "../FinancialMonth";
import type { ChecklistItem } from "../ChecklistItem";
import type { StatementRequirement } from "../StatementRequirement";
import { FinancialMonthStatus } from "../FinancialMonthStatus";
import { ChecklistItemStatus } from "../ChecklistItemStatus";
import { RequiredStatementType } from "../RequiredStatementType";

export function makeChecklistItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: "item-1",
    requirementId: "req-1",
    label: "HDFC Savings",
    statementType: RequiredStatementType.BANK,
    status: ChecklistItemStatus.PENDING,
    matchedStatementUploadId: null,
    satisfiedAt: null,
    ...overrides,
  };
}

export function makeFinancialMonth(overrides: Partial<FinancialMonth> = {}): FinancialMonth {
  return {
    id: "month-1",
    userId: "u1",
    year: 2026,
    month: 7,
    periodLabel: "2026-07",
    status: FinancialMonthStatus.OPEN,
    salaryConfirmed: false,
    salaryConfirmedAt: null,
    closingSnapshot: null,
    closedAt: null,
    archivedAt: null,
    checklistItems: [],
    ...overrides,
  };
}

export function makeStatementRequirement(overrides: Partial<StatementRequirement> = {}): StatementRequirement {
  return {
    id: "req-1",
    userId: "u1",
    label: "HDFC Savings",
    statementType: RequiredStatementType.BANK,
    linkedDebtId: null,
    autoManaged: false,
    isActive: true,
    ...overrides,
  };
}

/** Minimal stand-in for PipelineResult — only the shape
 * FinancialMonthClosingService.closeMonth()/buildClosingSnapshot() actually
 * reads (the 7 canonical-output fields; `aggregate`/`metadata` are
 * deliberately excluded from ClosingSnapshot so they're irrelevant here). */
export function makeFakePipelineResult(): {
  metricsSnapshot: unknown;
  trendReport: unknown;
  analyticsSnapshot: unknown;
  insightSnapshot: unknown;
  recommendationSnapshot: unknown;
  storySnapshot: unknown;
  review: unknown;
} {
  return {
    metricsSnapshot: { fake: "metrics" },
    trendReport: { fake: "trend" },
    analyticsSnapshot: { fake: "analytics" },
    insightSnapshot: { fake: "insights" },
    recommendationSnapshot: { fake: "recommendations" },
    storySnapshot: { fake: "story" },
    review: { fake: "review" },
  };
}
