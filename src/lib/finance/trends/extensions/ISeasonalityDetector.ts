import type { MetricType } from "../../metrics/MetricType";
import type { TrendDataPoint } from "../TrendDataPoint";

/**
 * Detected seasonality pattern for a single metric.
 * Months are 1-based (January = 1, December = 12).
 */
export interface SeasonalityPattern {
  readonly metricType: MetricType;
  readonly peakMonths: ReadonlyArray<number>;
  readonly troughMonths: ReadonlyArray<number>;
  /** Typical amplitude of seasonal variation as a fraction of the mean. */
  readonly amplitude: number;
  readonly confidence: number;
}

/**
 * Extension point for seasonal analysis.
 * Implementations are injected into TrendEngine (future milestone).
 * Requires ≥12 months of observations for meaningful results.
 */
export interface ISeasonalityDetector {
  detect(dataPoints: ReadonlyArray<TrendDataPoint>): SeasonalityPattern | null;
}
