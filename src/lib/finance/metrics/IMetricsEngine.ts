import type { MetricType } from "./MetricType";
import type { MetricDefinition } from "./MetricDefinition";
import type { MetricResult, MetricEvaluation } from "./MetricResult";
import type { FinancialAggregate } from "../aggregation/FinancialAggregate";

/**
 * Domain-layer contract for metric computation.
 *
 * IMetricsEngine is the interface downstream layers (Analytics, Insights,
 * the AI Coach) depend on. It accepts a FinancialAggregate and returns
 * MetricResult objects — no userId, no period, no repository access.
 *
 * @depends-on MetricRegistry, MetricCalculator implementations
 * @see MetricsEngine for the concrete implementation
 * @see IMetricsService for the higher-level application-layer service
 *      (orchestrates IFinancialAggregator + IMetricsEngine)
 */
export interface IMetricsEngine {
  /** Compute a single metric from the aggregate. Throws MetricNotSupportedError if unregistered. */
  compute(aggregate: FinancialAggregate, type: MetricType): MetricResult;

  /** Compute all registered metrics from the aggregate in a single pass. */
  computeAll(aggregate: FinancialAggregate): ReadonlyArray<MetricResult>;

  /** Compute a specific subset of metrics. */
  computeMany(
    aggregate: FinancialAggregate,
    types: ReadonlyArray<MetricType>,
  ): ReadonlyArray<MetricResult>;

  /**
   * Compute a metric and evaluate it against its health threshold.
   * Returns MetricEvaluation with isHealthy + distanceFromThreshold pre-computed.
   */
  evaluate(aggregate: FinancialAggregate, type: MetricType): MetricEvaluation;

  isSupported(type: MetricType): boolean;
  supportedTypes(): ReadonlyArray<MetricType>;

  /** Static MetricDefinition for every registered calculator, in registration order. */
  definitions(): ReadonlyArray<MetricDefinition>;
}
