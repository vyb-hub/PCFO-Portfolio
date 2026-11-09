import type { Money } from "../types/Money";
import type { Debt } from "./Debt";

/**
 * Aggregate view of a user's entire debt portfolio.
 */
export interface DebtSummary {
  readonly userId: string;
  readonly totalDebt: Money;
  readonly totalMinimumPayments: Money;
  /** Outstanding debt / annualised income */
  readonly debtToIncomeRatio: number;
  /** Ordered list of debts for the debt snowball strategy (lowest balance first) */
  readonly snowballOrder: readonly Debt[];
  /** Ordered list of debts for the debt avalanche strategy (highest interest rate first) */
  readonly avalancheOrder: readonly Debt[];
  /** ISO timestamp */
  readonly computedAt: string;
}
