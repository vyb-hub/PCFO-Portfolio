/**
 * Provenance metadata for a FinancialInsightSnapshot.
 */
export interface FinancialInsightMetadata {
  readonly userId: string;
  readonly generatedAt: Date;
  /** Number of generators that were invoked. */
  readonly generatorsRun: number;
  /** Number of generators that threw during generation. */
  readonly generatorFailures: number;
  /** Number of MetricResult objects consumed from the FinancialMetricsSnapshot. */
  readonly metricsConsumed: number;
  /** Number of MetricTrendResult objects consumed from the TrendReport. */
  readonly trendsConsumed: number;
}
