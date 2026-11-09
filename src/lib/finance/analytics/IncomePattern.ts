import type { Money } from "../types/Money";
import type { DateRange } from "../types/DateRange";
import type { Frequency } from "../types/Frequency";

/** A single identifiable income source */
export interface IncomeSourcePattern {
  readonly name: string;
  readonly estimatedAmount: Money;
  readonly frequency: Frequency;
  /** How consistent this income source is (0–1, 1 = perfectly regular) */
  readonly stabilityScore: number;
}

/**
 * Income pattern analysis for a user over a period.
 */
export interface IncomePattern {
  readonly userId: string;
  readonly period: DateRange;
  readonly sources: readonly IncomeSourcePattern[];
  /** Combined stability score across all income sources (0–1) */
  readonly overallStabilityScore: number;
  /** Whether income shows seasonal variation */
  readonly hasSeasonality: boolean;
  /** Months where income is historically higher, e.g. [3, 12] for March and December */
  readonly seasonalPeakMonths: readonly number[];
  readonly computedAt: string;
}
