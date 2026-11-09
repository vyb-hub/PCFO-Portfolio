import type { Money } from "../types/Money";

/**
 * Progress snapshot for a single Goal.
 */
export interface GoalProgress {
  readonly goalId: string;
  /** Fraction complete: currentAmount / targetAmount, clamped to 0–1 */
  readonly percentComplete: number;
  /** ISO date string of when the goal is expected to be achieved */
  readonly projectedCompletionDate: string;
  /** Monthly contribution required to hit targetDate */
  readonly monthlyContributionNeeded: Money;
  /** True if current contribution rate will meet the targetDate */
  readonly isOnTrack: boolean;
  /** Amount still needed */
  readonly remainingAmount: Money;
  /** ISO timestamp of when this progress was computed */
  readonly computedAt: string;
}
