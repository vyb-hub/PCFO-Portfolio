import type { TrendDataPoint } from "../TrendDataPoint";

/**
 * A structural break in the value series — a point where the mean or slope
 * changes significantly (e.g. after a major salary increase or debt payoff).
 */
export interface ChangePoint {
  readonly periodIndex: number;
  readonly periodLabel: string;
  readonly valueBefore: number;
  readonly valueAfter: number;
  /** Signed absolute change at the break point. */
  readonly changeMagnitude: number;
}

/**
 * Extension point for change-point detection (CUSUM, PELT, or similar).
 * Enables the AI Coach to narrate regime changes in the user's financial trajectory.
 */
export interface IChangePointDetector {
  detect(dataPoints: ReadonlyArray<TrendDataPoint>): ReadonlyArray<ChangePoint>;
}
