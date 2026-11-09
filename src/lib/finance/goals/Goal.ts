import type { Money } from "../types/Money";
import type { Frequency } from "../types/Frequency";

export enum GoalType {
  EMERGENCY_FUND = "EMERGENCY_FUND",
  DEBT_PAYOFF = "DEBT_PAYOFF",
  VACATION = "VACATION",
  HOME_PURCHASE = "HOME_PURCHASE",
  RETIREMENT = "RETIREMENT",
  EDUCATION = "EDUCATION",
  VEHICLE = "VEHICLE",
  CUSTOM = "CUSTOM",
}

export enum GoalStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  ON_TRACK = "ON_TRACK",
  AT_RISK = "AT_RISK",
  ACHIEVED = "ACHIEVED",
  ABANDONED = "ABANDONED",
}

/**
 * Domain model representing a single financial goal.
 */
export interface Goal {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly type: GoalType;
  readonly targetAmount: Money;
  readonly currentAmount: Money;
  /** ISO date string for the target completion date */
  readonly targetDate: string;
  /** Priority rank among all goals (1 = highest) */
  readonly priority: number;
  readonly status: GoalStatus;
  readonly contributionFrequency: Frequency;
  /** ISO date string */
  readonly createdAt: string;
  /** ISO date string */
  readonly updatedAt: string;
  /** Optional free-text description */
  readonly description?: string;
}
