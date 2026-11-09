// @depends-on: IFinancialAggregator, IMetricsEngine

import type { MetricType } from "./MetricType";
import type { MetricPeriod } from "./MetricPeriod";
import type { FinancialMetric } from "./FinancialMetric";
import type { MetricResult } from "./MetricResult";

/**
 * Service contract for computing financial metrics.
 *
 * The Metrics layer sits between the Financial Domain models and Analytics.
 * It transforms raw domain data into measurable, period-scoped facts
 * that Analytics can use to detect patterns and Insights can reference
 * as supporting evidence.
 *
 * Dependency flow:
 *   IFinancialAggregator → FinancialAggregate
 *     → IMetricsEngine (MetricsEngine + MetricRegistry)
 *     → IMetricsService  ← you are here
 *     → IAnalyticsService
 *     → IInsightEngine
 */
export interface IMetricsService {
  /**
   * Compute a single metric for the user and period.
   * Returns a FinancialMetric with trend data if a prior period exists.
   */
  compute(userId: string, type: MetricType, period: MetricPeriod): Promise<FinancialMetric>;

  /**
   * Compute all standard metrics for the user and period in a single pass.
   * Prefer this over multiple calls to compute() for efficiency.
   */
  computeAll(userId: string, period: MetricPeriod): Promise<readonly FinancialMetric[]>;

  /**
   * Return a MetricResult enriched with health thresholds.
   * This is what Insights consume to determine whether a metric warrants attention.
   */
  evaluate(userId: string, type: MetricType, period: MetricPeriod): Promise<MetricResult>;

  /**
   * Return the historical values for a metric across multiple consecutive periods.
   * Used by Analytics for trend detection.
   */
  getHistory(
    userId: string,
    type: MetricType,
    periods: readonly MetricPeriod[],
  ): Promise<readonly FinancialMetric[]>;

  /**
   * Return the healthy threshold for a metric type.
   * Does not require a userId — thresholds are global constants.
   */
  getThreshold(type: MetricType): import("./MetricDefinition").MetricThreshold;
}
