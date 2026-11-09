import type { Money } from "../types/Money";

export enum InvestmentType {
  MUTUAL_FUND = "MUTUAL_FUND",
  STOCKS = "STOCKS",
  FIXED_DEPOSIT = "FIXED_DEPOSIT",
  PPF = "PPF",
  EPF = "EPF",
  GOLD = "GOLD",
  REAL_ESTATE = "REAL_ESTATE",
  CRYPTO = "CRYPTO",
  BONDS = "BONDS",
  NPS = "NPS",
  OTHER = "OTHER",
}

export enum InvestmentStatus {
  ACTIVE = "ACTIVE",
  MATURED = "MATURED",
  EXITED = "EXITED",
}

/**
 * Domain model representing a single investment holding.
 */
export interface Investment {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly type: InvestmentType;
  readonly currentValue: Money;
  readonly investedAmount: Money;
  /** Absolute returns: currentValue - investedAmount */
  readonly absoluteReturns: Money;
  /** Percentage returns as a decimal, e.g. 0.12 for 12% */
  readonly percentageReturns: number;
  /**
   * Extended Internal Rate of Return (annualised).
   * null if insufficient history to compute.
   */
  readonly xirr: number | null;
  /** ISO date string of the investment start date */
  readonly startDate: string;
  /** ISO date string — null for open-ended investments */
  readonly maturityDate: string | null;
  readonly status: InvestmentStatus;
}
