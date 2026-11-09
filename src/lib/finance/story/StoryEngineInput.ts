import type { FinancialAggregate } from "../aggregation/FinancialAggregate";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";

/**
 * Everything a StoryBlockGenerator may read from.
 *
 * Deliberately excludes FinancialReview: the Story Engine's traceability
 * chain (Story -> Recommendation -> Insight -> Analytics -> Metric ->
 * FinancialAggregate -> Transactions) is a sibling of reviews/, not a
 * consumer of it. Both read the same five upstream snapshots independently.
 */
export interface StoryEngineInput {
  readonly aggregate: FinancialAggregate;
  readonly metricsSnapshot: FinancialMetricsSnapshot;
  readonly analyticsSnapshot: AnalyticsSnapshot;
  readonly insightSnapshot: FinancialInsightSnapshot;
  readonly recommendationSnapshot: RecommendationSnapshot;
}
