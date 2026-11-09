// @depends-on: IAnalyticsEngine, ISnapshotHistoryProvider, FinancialMetricsSnapshot

import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricType } from "../metrics/MetricType";
import type { AnalyticsFinding } from "./AnalyticsFinding";
import type { AnalysisFindingType } from "./AnalysisFindingType";
import type { AnalyticsSnapshot } from "./AnalyticsSnapshot";
import type { AnalyticsSummary } from "./AnalyticsSummary";

/**
 * Service contract for the Analytics Platform.
 *
 * IAnalyticsService is the boundary between the Analytics Platform and all
 * downstream consumers (Insight Platform, Recommendation Platform, AI Coach,
 * Dashboard). Consumers receive one AnalyticsSnapshot and never need to know:
 *   — how many historical snapshots existed
 *   — where history was stored
 *   — which analyzers ran
 *   — how trends or risks were detected
 *
 * Dependency flow:
 *   IFinancialMetricsSnapshotService → FinancialMetricsSnapshot
 *     → IAnalyticsService (internally: ISnapshotHistoryProvider + IAnalyticsEngine)
 *     → AnalyticsSnapshot
 *     → IInsightEngine
 *     → IRecommendationEngine
 *
 * Design contract:
 *   - analyze() fetches historical context internally; the caller supplies only
 *     the current snapshot and the userId.
 *   - New analyzers registered with the engine appear automatically in every
 *     subsequent AnalyticsSnapshot — no service code changes required.
 *   - No repository access, no AI, no financial calculations.
 */
export interface IAnalyticsService {
  /**
   * Analyze a user's financial trajectory.
   *
   * Internally merges the current snapshot with historical context from
   * ISnapshotHistoryProvider, runs all registered analyzers, and returns
   * one immutable AnalyticsSnapshot.
   *
   * When no historical snapshots are available, the analysis runs on the
   * current snapshot alone. Analyzers requiring more history are skipped.
   */
  analyze(
    userId: string,
    current: FinancialMetricsSnapshot,
  ): Promise<AnalyticsSnapshot>;

  /**
   * Return a lightweight AnalyticsSummary from an existing snapshot.
   * Suitable for list views and observability dashboards.
   */
  summarise(snapshot: AnalyticsSnapshot): AnalyticsSummary;

  /** Return all findings of a given type from an existing snapshot. */
  getFindingsByType(
    snapshot: AnalyticsSnapshot,
    type: AnalysisFindingType,
  ): ReadonlyArray<AnalyticsFinding>;

  /**
   * Return all findings related to a specific metric type.
   * A single metric may appear in TREND, VARIANCE, RISK, and SEASONALITY findings.
   */
  getFindingsByMetric(
    snapshot: AnalyticsSnapshot,
    metricType: MetricType,
  ): ReadonlyArray<AnalyticsFinding>;
}
