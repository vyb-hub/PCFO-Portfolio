// @depends-on: TransactionRepository, DebtRepository

import type { Money } from "../types/Money";
import type { Debt } from "./Debt";
import type { DebtSummary } from "./DebtSummary";

/** A detailed payoff projection for a single debt */
export interface DebtPayoffProjection {
  readonly debtId: string;
  readonly projectedPayoffDate: string;
  readonly totalInterestCost: Money;
  readonly monthsRemaining: number;
  /** Monthly payment required to hit `projectedPayoffDate` */
  readonly requiredMonthlyPayment: Money;
}

/** Optimal payoff strategy result */
export interface OptimalPayoffOrder {
  readonly strategy: "SNOWBALL" | "AVALANCHE";
  readonly orderedDebts: readonly Debt[];
  readonly totalInterestSaved: Money;
  readonly totalTimeSavedMonths: number;
}

/**
 * Service contract for debt tracking and payoff planning.
 * Implementations pull debt records from DebtRepository and
 * payment history from TransactionRepository.
 */
export interface IDebtService {
  /**
   * Return an aggregate summary of all active debts for the user,
   * including DTI ratio and both snowball/avalanche orderings.
   */
  getSummary(userId: string): Promise<DebtSummary>;

  /**
   * Compute the optimal payoff order using either snowball or avalanche strategy.
   * Compares both strategies and returns the one with lower total interest cost.
   */
  getOptimalPayoffOrder(userId: string): Promise<OptimalPayoffOrder>;

  /**
   * Project the payoff date and total interest cost for a specific debt,
   * optionally with an extra monthly payment amount applied.
   */
  projectPayoffDate(
    userId: string,
    debtId: string,
    extraMonthlyPayment?: Money
  ): Promise<DebtPayoffProjection>;

  /**
   * Compute the total interest cost over the life of a specific debt,
   * based on the outstanding principal, rate, and minimum payment schedule.
   */
  computeInterestCost(userId: string, debtId: string): Promise<Money>;
}
