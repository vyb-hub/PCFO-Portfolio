import type { Money } from "../types/Money";
import type { DateRange } from "../types/DateRange";

/** Spending in a single merchant */
export interface MerchantSpend {
  readonly merchant: string;
  readonly totalAmount: Money;
  readonly transactionCount: number;
}

/** Category-level spending breakdown */
export interface CategoryBreakdown {
  readonly category: string;
  readonly amount: Money;
  /** Fraction of total spending this category represents (0–1) */
  readonly share: number;
  /** Month-over-month delta: positive = increased spending */
  readonly momDelta: number;
}

/** A transaction flagged as unusual */
export interface UnusualSpend {
  readonly transactionId: string;
  readonly amount: Money;
  readonly merchant: string;
  readonly date: string;
  readonly reason: string;
}

/**
 * Spending pattern analysis for a given period.
 */
export interface SpendingPattern {
  readonly userId: string;
  readonly period: DateRange;
  readonly categoryBreakdowns: readonly CategoryBreakdown[];
  /** Top 5 merchants by spend */
  readonly topMerchants: readonly MerchantSpend[];
  readonly unusualSpends: readonly UnusualSpend[];
  readonly computedAt: string;
}
