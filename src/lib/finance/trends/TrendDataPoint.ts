import type { MetricType, MetricUnit } from "../metrics/MetricType";
import type { MetricDefinition } from "../metrics/MetricDefinition";

/**
 * A single observation extracted from a FinancialMetricsSnapshot for trend analysis.
 * Carries the MetricDefinition so the analyzer can resolve threshold semantics
 * (isHigherBetter) without external lookups.
 */
export interface TrendDataPoint {
  readonly period: string;
  readonly value: number;
  readonly metricType: MetricType;
  readonly unit: MetricUnit;
  readonly definition: MetricDefinition;
}
