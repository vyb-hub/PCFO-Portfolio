import type { MetricType, MetricUnit } from "../../metrics/MetricType";

/**
 * Lightweight health summary for a single metric.
 * The full MetricResult lives in FinancialMetricsSnapshot.results.
 */
export interface MetricHealthEntry {
  readonly metricType: MetricType;
  readonly isHealthy: boolean;
  readonly value: number;
  readonly unit: MetricUnit;
  /** Signed distance from threshold: negative = outside healthy range. */
  readonly distanceFromThreshold: number;
}

/**
 * Full metric health view across all evaluated metrics.
 * Answers: "Which metrics are healthy and which need attention?"
 */
export interface FinancialHealthSection {
  readonly type: "FINANCIAL_HEALTH";
  readonly healthyMetricCount: number;
  readonly unhealthyMetricCount: number;
  /** All evaluated metrics with health context; order mirrors snapshot evaluations. */
  readonly metrics: ReadonlyArray<MetricHealthEntry>;
  /** MetricTypes outside their healthy range, sorted by |distanceFromThreshold| descending. */
  readonly unhealthyMetricTypes: ReadonlyArray<MetricType>;
  readonly referencedMetricTypes: ReadonlyArray<MetricType>;
}
