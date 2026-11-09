import type { Money } from "../types/Money";
import type { AggregatePeriod } from "./AggregatePeriod";

/**
 * Lightweight summary of a FinancialAggregate — counts and totals
 * without the full transaction list.
 *
 * Use for dashboard cards and list views where the full aggregate is not needed.
 * For detailed computation, obtain the full FinancialAggregate instead.
 */
export interface AggregateSummary {
  readonly userId: string;
  readonly period: AggregatePeriod;
  readonly transactionCount: number;
  readonly totalCredits: Money;
  readonly totalDebits: Money;
  readonly activeDebtCount: number;
  readonly activeGoalCount: number;
  readonly activeInvestmentCount: number;
  readonly recurringPaymentCount: number;
  readonly accountCount: number;
  readonly computedAt: Date;
}
