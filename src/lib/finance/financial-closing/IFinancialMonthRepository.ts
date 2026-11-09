import type { FinancialMonth } from "./FinancialMonth";

/**
 * Port: FinancialMonth (+ its checklist items) data access.
 * Implementation lives outside the finance domain (PrismaFinancialMonthRepository).
 */
export interface IFinancialMonthRepository {
  findByPeriod(userId: string, year: number, month: number): Promise<FinancialMonth | null>;

  /** Instantiates a new FinancialMonth in OPEN status, with one PENDING
   * checklist item per given requirement id. */
  create(
    userId: string,
    year: number,
    month: number,
    periodLabel: string,
    requirementIds: ReadonlyArray<string>,
  ): Promise<FinancialMonth>;

  findById(userId: string, monthId: string): Promise<FinancialMonth | null>;

  findLatestClosed(userId: string): Promise<FinancialMonth | null>;

  /** Persists the full aggregate — status, salary fields, closingSnapshot,
   * closedAt/archivedAt, and every checklist item's status/match/satisfiedAt —
   * in one call. */
  save(month: FinancialMonth): Promise<FinancialMonth>;
}
