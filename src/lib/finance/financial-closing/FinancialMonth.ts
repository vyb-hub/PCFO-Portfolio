import type { FinancialMonthStatus } from "./FinancialMonthStatus";
import type { ChecklistItem } from "./ChecklistItem";
import type { ClosingSnapshot } from "./ClosingSnapshot";

/**
 * The monthly lifecycle aggregate root: OPEN -> COLLECTING_DATA ->
 * READY_TO_CLOSE -> CLOSED -> ARCHIVED. Pure state/orchestration — never
 * computes a financial figure itself. IFinancialMonthRepository.save()
 * persists this object (including its checklistItems) as one unit.
 */
export interface FinancialMonth {
  readonly id: string;
  readonly userId: string;
  readonly year: number;
  readonly month: number; // 1-12
  readonly periodLabel: string; // "2026-07"
  readonly status: FinancialMonthStatus;
  readonly salaryConfirmed: boolean;
  readonly salaryConfirmedAt: Date | null;
  readonly closingSnapshot: ClosingSnapshot | null;
  readonly closedAt: Date | null;
  readonly archivedAt: Date | null;
  readonly checklistItems: ReadonlyArray<ChecklistItem>;
}
