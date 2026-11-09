// @depends-on: IFinancialInsightService, FinancialInsightSnapshot, IAnalyticsService, AnalyticsSnapshot, IFinancialMetricsSnapshotService, FinancialMetricsSnapshot

import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "./RecommendationSnapshot";
import type { RecommendationSummary } from "./RecommendationSummary";
import type { Recommendation } from "./Recommendation";
import type { RecommendationCategory } from "./RecommendationCategory";
import type { RecommendationPriority } from "./RecommendationPriority";

/**
 * Public service contract for the Recommendation Platform.
 *
 * IRecommendationService is the boundary that the AI Coach, Dashboard, and
 * What-If Engine depend on. No downstream consumer should reference
 * RecommendationGenerator implementations or RecommendationEngine directly.
 *
 * Dependency flow:
 *   FinancialMetricsSnapshot + AnalyticsSnapshot + InsightSnapshot
 *     → IRecommendationService → RecommendationSnapshot
 *                               → AI Coach
 *                               → Dashboard
 *                               → What-If Engine
 */
export interface IRecommendationService {
  /**
   * Generate a RecommendationSnapshot from the three upstream snapshots.
   * Recommendations are sorted CRITICAL → HIGH → MEDIUM → LOW.
   */
  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): RecommendationSnapshot;

  /**
   * Derive a lightweight summary from an existing RecommendationSnapshot.
   * Suitable for dashboard counts, notification badges, and Coach context loading.
   */
  summarise(snapshot: RecommendationSnapshot): RecommendationSummary;

  /**
   * Return all recommendations in the given category, preserving their
   * CRITICAL → HIGH → MEDIUM → LOW sort order.
   */
  getByCategory(
    snapshot: RecommendationSnapshot,
    category: RecommendationCategory,
  ): ReadonlyArray<Recommendation>;

  /**
   * Return all recommendations at the given priority level, preserving their
   * original sort order.
   */
  getByPriority(
    snapshot: RecommendationSnapshot,
    priority: RecommendationPriority,
  ): ReadonlyArray<Recommendation>;
}
