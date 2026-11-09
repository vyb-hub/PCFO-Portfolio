import type { AggregatePeriod } from "../../aggregation/AggregatePeriod";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult, MetricEvaluation } from "../MetricResult";
import type { MetricType } from "../MetricType";
import type { SnapshotMetadata } from "./SnapshotMetadata";

/**
 * A record of a single metric execution that threw during FinancialMetricsSnapshotService.build().
 *
 * The snapshot captures failures so that consumers can distinguish "metric
 * not supported" from "metric computation error". A partial snapshot (some
 * failures) is still valid and usable.
 */
export interface MetricExecutionFailure {
  readonly type: MetricType;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

/**
 * An immutable point-in-time record of every registered financial metric.
 *
 * FinancialMetricsSnapshot is the official contract between the Metrics
 * Platform and all downstream layers (Analytics, Insights, Recommendations,
 * AI Coach). No downstream layer should invoke MetricCalculators directly.
 *
 * Construction:
 *   const snapshot = new FinancialMetricsSnapshotService(engine).build(aggregate);
 *
 * Access:
 *   service.getResult(snapshot, MetricType.SAVINGS_RATE)
 *   service.getEvaluation(snapshot, MetricType.DEBT_TO_INCOME_RATIO)
 *
 * New metrics registered with the engine automatically appear in every
 * subsequent snapshot — no snapshot code changes required.
 */
export interface FinancialMetricsSnapshot {
  readonly userId: string;
  /** The reporting period inherited from the source FinancialAggregate. */
  readonly period: AggregatePeriod;
  readonly metadata: SnapshotMetadata;
  /** Successful MetricResult objects, one per computed metric type. */
  readonly results: ReadonlyArray<MetricResult>;
  /**
   * MetricEvaluation objects for every successful result.
   * Includes health status even for metrics with no threshold
   * (isHealthy=true, distanceFromThreshold=0).
   */
  readonly evaluations: ReadonlyArray<MetricEvaluation>;
  /** Metrics that threw an error during computation. */
  readonly failures: ReadonlyArray<MetricExecutionFailure>;
  /**
   * Static MetricDefinition for every registered calculator — including
   * those that failed to compute. Enables API discovery and UI generation
   * without executing any calculations.
   */
  readonly definitions: ReadonlyArray<MetricDefinition>;
}
