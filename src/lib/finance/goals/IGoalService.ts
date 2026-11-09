// @depends-on: GoalRepository, TransactionRepository, ICashFlowService

import type { Money } from "../types/Money";
import type { Goal } from "./Goal";
import type { GoalProgress } from "./GoalProgress";

/**
 * Service contract for managing financial goals and tracking progress.
 * Implementations read goals from GoalRepository and use cash flow data
 * from ICashFlowService to project realistic contribution capacity.
 */
export interface IGoalService {
  /**
   * Return all goals for the user, ordered by priority.
   */
  getAll(userId: string): Promise<readonly Goal[]>;

  /**
   * Compute the current progress for a specific goal, including
   * projected completion date and monthly contribution needed.
   */
  getProgress(userId: string, goalId: string): Promise<GoalProgress>;

  /**
   * Recommend an optimal monthly contribution amount for a goal
   * given the user's available monthly surplus (derived from cash flow).
   * Takes into account all active goals sorted by priority.
   */
  recommendContribution(userId: string, goalId: string): Promise<Money>;

  /**
   * Project the completion date for a goal given a specific monthly contribution.
   * Returns an ISO date string.
   */
  projectCompletion(
    userId: string,
    goalId: string,
    monthlyContribution: Money
  ): Promise<string>;
}
