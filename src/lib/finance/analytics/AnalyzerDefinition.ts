import type { AnalyzerType } from "./AnalyzerType";

/**
 * Static metadata for an AnalyticsAnalyzer.
 *
 * AnalyzerDefinition is owned by the analyzer class as a static constant —
 * analogous to MetricDefinition on MetricCalculator.
 */
export interface AnalyzerDefinition {
  readonly id: AnalyzerType;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  /**
   * Minimum number of FinancialMetricsSnapshots required for this analyzer
   * to produce meaningful output.
   *
   * The AnalyticsEngine skips an analyzer when the snapshot count falls below
   * this threshold rather than running it on insufficient data.
   */
  readonly minimumSnapshots: number;
}
