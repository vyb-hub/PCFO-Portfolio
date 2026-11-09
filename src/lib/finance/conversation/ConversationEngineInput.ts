import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";
import type { FinancialReview } from "../reviews/FinancialReview";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";

/**
 * Everything a ConversationContextBuilder may read from.
 *
 * Pre-fetched by the caller (FinancialStateService, in pipeline/) — mirrors
 * StoryEngineInput's pattern. Deliberately excludes FinancialAggregate,
 * FinancialMetricsSnapshot, and AnalyticsSnapshot: the Conversation Platform
 * never touches metrics/analytics/repositories directly (the charter's Core
 * Principle), only the already-deterministic Story/Review/Recommendation/
 * Insight family.
 */
export interface ConversationEngineInput {
  readonly userId: string;
  readonly storySnapshot: FinancialStorySnapshot;
  readonly review: FinancialReview;
  readonly insightSnapshot: FinancialInsightSnapshot;
  readonly recommendationSnapshot: RecommendationSnapshot;
}
