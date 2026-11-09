import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";
import type { FinancialMemoryEntryDraft } from "./FinancialMemoryEntry";

/**
 * Converts immutable financial snapshots into indexable memory entry drafts.
 *
 * The indexer is a pure transformation — no I/O, no embeddings, no persistence.
 * It produces FinancialMemoryEntryDraft objects (no id, no embedding, no createdAt);
 * the FinancialMemoryService materialises them by assigning IDs, computing
 * embeddings, and persisting to the MemoryStore.
 *
 * Design rule: the indexer decides WHAT to store (which facts from a snapshot
 * are worth indexing and how to phrase them as prose). The service decides
 * HOW to store (embedding model, store implementation, TTL policy).
 *
 * Provided implementation: DefaultMemoryIndexer
 */
export interface MemoryIndexer {
  /**
   * Extract indexable metric facts from a FinancialMetricsSnapshot.
   * Typically produces one summary entry plus one entry per unhealthy metric.
   */
  indexMetrics(userId: string, snapshot: FinancialMetricsSnapshot): ReadonlyArray<FinancialMemoryEntryDraft>;

  /**
   * Extract indexable analytical findings from an AnalyticsSnapshot.
   * Typically produces one entry per AnalyticsFinding.
   */
  indexAnalytics(userId: string, snapshot: AnalyticsSnapshot): ReadonlyArray<FinancialMemoryEntryDraft>;

  /**
   * Extract indexable insight facts from a FinancialInsightSnapshot.
   * Typically produces one entry per FinancialInsight.
   *
   * EC-012: retyped from the legacy InsightSnapshot, which the real pipeline
   * has never actually produced — storeInsights() was unreachable/untested
   * against real data until this fix.
   */
  indexInsights(userId: string, snapshot: FinancialInsightSnapshot): ReadonlyArray<FinancialMemoryEntryDraft>;

  /**
   * Extract indexable recommendation facts from a RecommendationSnapshot.
   * Typically produces one entry per Recommendation.
   */
  indexRecommendations(userId: string, snapshot: RecommendationSnapshot): ReadonlyArray<FinancialMemoryEntryDraft>;

  /**
   * Extract indexable story facts from a FinancialStorySnapshot.
   * Typically produces one entry per StoryBlock. (EC-012)
   */
  indexStory(userId: string, snapshot: FinancialStorySnapshot): ReadonlyArray<FinancialMemoryEntryDraft>;
}
