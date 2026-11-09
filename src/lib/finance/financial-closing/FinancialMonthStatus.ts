/**
 * Deterministic lifecycle state of a FinancialMonth. Mirrors the Prisma
 * enum of the same name. Transitions are computed by ClosingReadinessEvaluator
 * — never set ad hoc by a caller (except the terminal CLOSED/ARCHIVED writes
 * FinancialMonthClosingService.closeMonth() itself makes).
 */
export enum FinancialMonthStatus {
  OPEN = "OPEN",
  COLLECTING_DATA = "COLLECTING_DATA",
  READY_TO_CLOSE = "READY_TO_CLOSE",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED",
}
