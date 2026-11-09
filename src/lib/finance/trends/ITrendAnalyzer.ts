import type { TrendDataPoint } from "./TrendDataPoint";
import type { MetricTrendResult } from "./MetricTrendResult";

/**
 * Plugin interface for metric trend analysis.
 *
 * An ITrendAnalyzer receives a chronologically-ordered series of observations
 * for a single metric type and returns a MetricTrendResult.
 *
 * Implementations must:
 *   - Be deterministic for the same input
 *   - Never call external services or touch I/O
 *   - Throw when dataPoints is empty (callers must pre-validate)
 */
export interface ITrendAnalyzer {
  analyze(dataPoints: ReadonlyArray<TrendDataPoint>): MetricTrendResult;
}
