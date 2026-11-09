import type { MetricType } from "../../metrics/MetricType";

/**
 * Priority actions and watch items for the upcoming reporting period.
 * Answers: "What should I focus on next month?"
 */
export interface NextMonthFocusSection {
  readonly type: "NEXT_MONTH_FOCUS";
  /**
   * CRITICAL and HIGH priority recommendation IDs — the actionable items
   * requiring attention in the next period.
   */
  readonly priorityActionIds: ReadonlyArray<string>;
  /**
   * Unhealthy MetricTypes that should be monitored, ordered by severity
   * of their associated insights.
   */
  readonly watchlistMetricTypes: ReadonlyArray<MetricType>;
  /**
   * Active RISK insight IDs — risks that persist into the next period.
   * Sorted by severity (CRITICAL → LOW).
   */
  readonly activeRiskInsightIds: ReadonlyArray<string>;
  readonly referencedRecommendationIds: ReadonlyArray<string>;
  readonly referencedInsightIds: ReadonlyArray<string>;
  readonly referencedMetricTypes: ReadonlyArray<MetricType>;
}
