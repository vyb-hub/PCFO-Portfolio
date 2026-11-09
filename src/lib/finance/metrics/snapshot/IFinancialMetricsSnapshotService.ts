import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";
import type { MetricEvaluation, MetricResult } from "../MetricResult";
import type { MetricType } from "../MetricType";
import type { FinancialMetricsSnapshot } from "./FinancialMetricsSnapshot";
import type { SnapshotSummary } from "./SnapshotSummary";

// @depends-on: IMetricsEngine, FinancialAggregate

/**
 * Service contract for building and querying FinancialMetricsSnapshots.
 *
 * IFinancialMetricsSnapshotService is the boundary between the Metrics
 * Platform and all downstream layers. Analytics, Insights, Recommendations,
 * and the AI Coach depend on this interface, not on individual calculators.
 *
 * Dependency flow:
 *   FinancialAggregate (from IFinancialAggregator)
 *     → IMetricsEngine (executes all registered calculators)
 *     → IFinancialMetricsSnapshotService  ← you are here
 *     → IAnalyticsService
 *     → IInsightEngine
 *     → IRecommendationEngine
 *
 * Design contract:
 *   - build() executes every registered metric and captures failures.
 *   - New metrics added to the engine appear automatically in every
 *     subsequent snapshot — no snapshot code changes required.
 *   - No repository access, no AI, no trend analysis.
 */
export interface IFinancialMetricsSnapshotService {
  /**
   * Execute all registered metrics against the aggregate and return
   * one immutable FinancialMetricsSnapshot.
   *
   * Execution errors are captured as MetricExecutionFailure entries —
   * they do not abort the build. A partial snapshot is still valid.
   */
  build(aggregate: FinancialAggregate): FinancialMetricsSnapshot;

  /**
   * Return a lightweight SnapshotSummary from an existing snapshot.
   * Summary is suitable for list views and observability dashboards.
   */
  summarise(snapshot: FinancialMetricsSnapshot): SnapshotSummary;

  /** Return the MetricResult for a specific type, or undefined if it failed/is absent. */
  getResult(snapshot: FinancialMetricsSnapshot, type: MetricType): MetricResult | undefined;

  /** Return the MetricEvaluation (with health status) for a specific type, or undefined. */
  getEvaluation(snapshot: FinancialMetricsSnapshot, type: MetricType): MetricEvaluation | undefined;

  /** True when the metric computed successfully and its result is present in the snapshot. */
  hasMetric(snapshot: FinancialMetricsSnapshot, type: MetricType): boolean;
}
