import type { AggregatePeriod } from "../aggregation/AggregatePeriod";
import type { FinancialHealthTier } from "./FinancialHealthTier";

/**
 * Lightweight read model of a FinancialReview for list views, dashboards,
 * and notification digests.
 *
 * Does not duplicate full review data — downstream consumers that need
 * full section detail should hold the FinancialReview itself.
 */
export interface FinancialReviewSummary {
  readonly id: string;
  readonly userId: string;
  readonly period: AggregatePeriod;
  readonly generatedAt: Date;
  /** Fraction of metric evaluations that are healthy (0.0–1.0). */
  readonly overallHealthScore: number;
  readonly healthTier: FinancialHealthTier;
  /** Combined count of CRITICAL and HIGH severity concerns. */
  readonly totalCriticalAndHighConcerns: number;
  /** Count of POSITIVE and MILESTONE insights. */
  readonly achievementCount: number;
  /** Count of CRITICAL and HIGH priority recommendations. */
  readonly urgentRecommendationCount: number;
  /**
   * ID of the most important concern this period.
   * Mirrors FinancialReview.executiveSummary.topConcernInsightId.
   */
  readonly topConcernInsightId: string | null;
}
