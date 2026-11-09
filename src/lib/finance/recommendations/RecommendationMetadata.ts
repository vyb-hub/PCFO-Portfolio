/**
 * Provenance and execution statistics for a RecommendationSnapshot.
 * Traces back to all three input snapshots.
 */
export interface RecommendationMetadata {
  readonly userId: string;
  readonly generatedAt: Date;
  /** Timestamp from FinancialMetricsSnapshot.metadata.generatedAt */
  readonly metricsGeneratedAt: Date;
  /** Timestamp from AnalyticsSnapshot.metadata.analyzedAt */
  readonly analyticsAnalyzedAt: Date;
  /** Timestamp from InsightSnapshot.metadata.generatedAt */
  readonly insightsGeneratedAt: Date;
  /** How many generators ran. */
  readonly generatorsRun: number;
  /** How many generators threw during execution. */
  readonly generatorFailures: number;
  readonly totalRecommendations: number;
  readonly criticalRecommendations: number;
  readonly highRecommendations: number;
  readonly mediumRecommendations: number;
  readonly lowRecommendations: number;
}
