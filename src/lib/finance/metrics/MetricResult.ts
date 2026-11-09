import type { MetricType, MetricUnit } from "./MetricType";
import type { MetricDefinition, MetricThreshold } from "./MetricDefinition";
import type { AggregatePeriod } from "../aggregation/AggregatePeriod";

/**
 * The direct output of a MetricCalculator.calculate() call.
 *
 * MetricResult is immutable and self-describing — it carries its own
 * MetricDefinition so consumers (Analytics, Insights) never need to
 * perform a separate lookup to understand what the value means.
 *
 * MetricResult is NOT a persistence model. To store a metric with
 * trend and user context, convert to FinancialMetric at the service layer.
 */
export interface MetricResult {
  readonly type: MetricType;
  readonly value: number;
  readonly unit: MetricUnit;
  /** The aggregate period this result was computed from. */
  readonly period: AggregatePeriod;
  readonly calculatedAt: Date;
  /** Static metadata for this metric type. Identical across all results of the same type. */
  readonly definition: MetricDefinition;
}

/**
 * A MetricResult enriched with health context.
 *
 * MetricEvaluation is what the Insight Engine consumes to determine
 * whether a metric warrants user attention.
 */
export interface MetricEvaluation {
  readonly result: MetricResult;
  readonly threshold: MetricThreshold;
  /** True when value falls within the healthy range defined by threshold. */
  readonly isHealthy: boolean;
  /**
   * Signed distance from the nearest threshold boundary.
   * Negative = outside healthy range (by this much).
   * Zero = exactly at the boundary.
   * Positive = inside healthy range (by this much).
   */
  readonly distanceFromThreshold: number;
}
