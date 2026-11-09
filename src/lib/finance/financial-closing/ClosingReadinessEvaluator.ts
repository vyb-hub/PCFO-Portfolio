import type { FinancialMonth } from "./FinancialMonth";
import { FinancialMonthStatus } from "./FinancialMonthStatus";
import { ChecklistItemStatus } from "./ChecklistItemStatus";

/**
 * Pure state machine: FinancialMonth -> next FinancialMonthStatus.
 *
 * CLOSED/ARCHIVED are terminal — no automatic transition out (reopening is
 * an explicit, debug-only operation in FinancialMonthClosingService, not
 * something this evaluator ever decides). Otherwise:
 *   OPEN            -> COLLECTING_DATA  once >=1 checklist item is SATISFIED
 *   COLLECTING_DATA -> READY_TO_CLOSE   once every checklist item is
 *                                       SATISFIED AND salary is confirmed
 * Zero active checklist items is vacuously "all satisfied" — a month with no
 * configured requirements can still become READY_TO_CLOSE on salary
 * confirmation alone.
 */
export class ClosingReadinessEvaluator {
  nextStatus(month: FinancialMonth): FinancialMonthStatus {
    if (month.status === FinancialMonthStatus.CLOSED || month.status === FinancialMonthStatus.ARCHIVED) {
      return month.status;
    }

    const items = month.checklistItems;
    const anySatisfied = items.some(i => i.status === ChecklistItemStatus.SATISFIED);
    const allSatisfied = items.length === 0 || items.every(i => i.status === ChecklistItemStatus.SATISFIED);

    if (allSatisfied && month.salaryConfirmed) return FinancialMonthStatus.READY_TO_CLOSE;
    if (anySatisfied) return FinancialMonthStatus.COLLECTING_DATA;
    return FinancialMonthStatus.OPEN;
  }
}
