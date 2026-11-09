import type { BudgetRecord } from "./BudgetRecord";
import type { AggregatePeriod } from "./AggregatePeriod";

/**
 * Port: budget data access.
 * Implementations live outside the finance domain (e.g., PrismaBudgetRepository).
 */
export interface IBudgetRepository {
  findByUser(userId: string): Promise<ReadonlyArray<BudgetRecord>>;
  findActive(userId: string): Promise<ReadonlyArray<BudgetRecord>>;
  findByPeriod(userId: string, period: AggregatePeriod): Promise<ReadonlyArray<BudgetRecord>>;
  findByCategory(userId: string, category: string): Promise<ReadonlyArray<BudgetRecord>>;
}
