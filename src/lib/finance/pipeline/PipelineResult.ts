import type { FinancialAggregate } from "../aggregation/FinancialAggregate";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialReview } from "../reviews/FinancialReview";
import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";

export interface PipelineMetadata {
  readonly userId: string;
  readonly ranAt: Date;
  readonly durationMs: number;
  /**
   * Number of historical snapshots available for trend/analytics.
   * On first run this is 1 (the current snapshot only).
   * See CALIBRATION_NOTES.md for implications.
   */
  readonly historicalSnapshotCount: number;
  /**
   * Analytics analyzers skipped because they required more than 1 snapshot.
   * Expected to be >0 on first run.
   */
  readonly analyticsAnalyzersSkipped: number;
}

/**
 * The immutable output of one pipeline execution.
 *
 * Every intermediate snapshot is preserved so callers can inspect
 * each layer independently (dashboard, AI Coach, reports, debug tooling).
 */
export interface PipelineResult {
  readonly metadata: PipelineMetadata;
  readonly aggregate: FinancialAggregate;
  readonly metricsSnapshot: FinancialMetricsSnapshot;
  readonly trendReport: TrendReport;
  readonly analyticsSnapshot: AnalyticsSnapshot;
  readonly insightSnapshot: FinancialInsightSnapshot;
  readonly recommendationSnapshot: RecommendationSnapshot;
  readonly review: FinancialReview;
  /**
   * Story Engine output (EC-011). A sibling of `review`, not layered on top
   * of it — both are independent consumers of the same five upstream
   * snapshots (aggregate, metrics, analytics, insights, recommendations).
   */
  readonly storySnapshot: FinancialStorySnapshot;
}
