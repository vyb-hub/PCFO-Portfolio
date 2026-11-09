import type { TrendDataPoint } from "../TrendDataPoint";

export interface OutlierResult {
  readonly dataPoint: TrendDataPoint;
  /** Signed z-score relative to the series mean. */
  readonly zscore: number;
  readonly isOutlier: boolean;
}

/**
 * Extension point for statistical outlier detection (e.g. z-score > 2.5).
 * Outlier-flagged points can be suppressed before trend calculation to
 * improve robustness in the presence of one-off anomalies.
 */
export interface IOutlierDetector {
  detect(dataPoints: ReadonlyArray<TrendDataPoint>): ReadonlyArray<OutlierResult>;
}
