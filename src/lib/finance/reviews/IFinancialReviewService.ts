// @depends-on: FinancialMetricsSnapshot, FinancialInsightSnapshot, RecommendationSnapshot
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialReview } from "./FinancialReview";
import type { FinancialReviewSummary } from "./FinancialReviewSummary";
import type { MetricType } from "../metrics/MetricType";

/**
 * Public service contract for the Financial Review Engine.
 *
 * IFinancialReviewService is the boundary between the Review layer and all
 * downstream consumers (Dashboard, AI Coach, PDF export, Email).
 *
 * Downstream consumers hold a FinancialReview and may call helper methods
 * here for cross-cutting queries — they must not reimplement the query logic.
 */
export interface IFinancialReviewService {
  /**
   * Assemble a FinancialReview from the three required snapshots.
   * Deterministic given identical inputs.
   */
  build(
    metricsSnapshot: FinancialMetricsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
    recommendationSnapshot: RecommendationSnapshot,
  ): FinancialReview;

  /** Extract the lightweight FinancialReviewSummary from a review. */
  summarise(review: FinancialReview): FinancialReviewSummary;

  /**
   * Return the deduplicated union of all insight IDs referenced across
   * every section of the review.
   */
  allReferencedInsightIds(review: FinancialReview): ReadonlyArray<string>;

  /**
   * Return the deduplicated union of all recommendation IDs referenced
   * across every section of the review.
   */
  allReferencedRecommendationIds(review: FinancialReview): ReadonlyArray<string>;

  /**
   * Return the deduplicated union of all metric types referenced across
   * every section of the review.
   */
  allReferencedMetricTypes(review: FinancialReview): ReadonlyArray<MetricType>;
}
