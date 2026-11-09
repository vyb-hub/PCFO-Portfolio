import type { FinancialSnapshot } from "../analytics/FinancialSnapshot";
import type { CashFlow } from "../cashflow/CashFlow";
import type { Money } from "../types/Money";

/**
 * A concrete plan showing what it would take to achieve a specific goal.
 */
export interface GoalPlan {
  readonly goalId: string;
  readonly userId: string;
  /** Monthly savings amount required to hit the goal on time. */
  readonly requiredMonthlySavings: Money;
  readonly projectedCompletionDate: Date;
  /**
   * A projected cash flow showing how the user's budget would look
   * if they allocated the required monthly savings.
   */
  readonly adjustedCashFlow: CashFlow;
  /**
   * Trade-offs the user would need to accept
   * (e.g. "Reduce dining spend by ₹3,000/month").
   */
  readonly tradeoffs: readonly string[];
  readonly computedAt: Date;
}

/**
 * Contract for the Goal Planning engine.
 *
 * The planner takes a user's current financial state and a specific goal,
 * then computes the concrete savings plan required to achieve it.
 * It identifies trade-offs within the existing cash flow without
 * requiring manual input from the user.
 *
 * @future Milestone 3+
 */
export interface IGoalPlanner {
  /**
   * Compute a savings plan for a single goal.
   * Uses the user's current FinancialSnapshot as the baseline.
   */
  planForGoal(userId: string, goalId: string): Promise<GoalPlan>;

  /**
   * Compute plans for all active goals, ranked by priority.
   * Plans may share cash flow adjustments, so they are computed together
   * to avoid recommending incompatible trade-offs.
   */
  planForAllGoals(userId: string): Promise<readonly GoalPlan[]>;

  /**
   * Recompute plans after a financial change (new transaction, debt payoff, etc.).
   * Accepts a fresh snapshot rather than re-fetching from the database.
   */
  replanAfterChange(userId: string, snapshot: FinancialSnapshot): Promise<readonly GoalPlan[]>;
}
