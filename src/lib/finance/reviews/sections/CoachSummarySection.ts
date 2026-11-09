import type { MetricType } from "../../metrics/MetricType";
import type { FinancialHealthTier } from "../FinancialHealthTier";

/**
 * Structured inputs for the AI Coach to use when building a narrative.
 *
 * CoachSummarySection does NOT contain prose. It provides the signal set
 * the AI Coach needs to answer: "What is the most important thing to tell
 * the user about this period?"
 *
 * The AI Coach transforms this structure into natural language.
 * This section never performs that transformation.
 */
export interface CoachSummarySection {
  readonly type: "COACH_SUMMARY";
  /**
   * Up to 5 insight IDs, ordered CRITICAL RISK first, then HIGH RISK,
   * then WARNING, then POSITIVE — for the Coach to incorporate into narrative.
   */
  readonly primaryInsightIds: ReadonlyArray<string>;
  /**
   * Up to 3 recommendation IDs (CRITICAL first, then HIGH) for the Coach to reference.
   */
  readonly primaryRecommendationIds: ReadonlyArray<string>;
  /**
   * Unhealthy MetricTypes the Coach should address, ordered by
   * |distanceFromThreshold| descending — up to 5.
   */
  readonly keyMetricTypes: ReadonlyArray<MetricType>;
  /** True when > 50% of metric evaluations are healthy. */
  readonly isPositivePeriod: boolean;
  readonly healthTier: FinancialHealthTier;
  readonly referencedInsightIds: ReadonlyArray<string>;
  readonly referencedRecommendationIds: ReadonlyArray<string>;
  readonly referencedMetricTypes: ReadonlyArray<MetricType>;
}
