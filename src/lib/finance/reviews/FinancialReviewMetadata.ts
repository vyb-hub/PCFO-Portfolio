/**
 * Provenance and execution statistics for a FinancialReview.
 *
 * Traces the review back to each of its three input snapshots.
 */
export interface FinancialReviewMetadata {
  readonly userId: string;
  readonly generatedAt: Date;
  /** metadata.generatedAt from FinancialMetricsSnapshot. */
  readonly metricsSnapshotGeneratedAt: Date;
  /** generatedAt from FinancialInsightSnapshot. */
  readonly insightSnapshotGeneratedAt: Date;
  /** metadata.generatedAt from RecommendationSnapshot. */
  readonly recommendationSnapshotGeneratedAt: Date;
  /** Semver string formatted from SnapshotVersion. */
  readonly metricsSnapshotVersion: string;
  /** snapshotVersion string from FinancialInsightSnapshot. */
  readonly insightSnapshotVersion: string;
  /** Total MetricEvaluation objects considered. */
  readonly totalMetricsConsidered: number;
  /** Total FinancialInsight objects considered. */
  readonly totalInsightsConsidered: number;
  /** Total Recommendation objects considered. */
  readonly totalRecommendationsConsidered: number;
}
