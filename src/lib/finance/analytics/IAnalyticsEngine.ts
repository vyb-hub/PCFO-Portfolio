import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsFinding } from "./AnalyticsFinding";
import type { AnalysisFindingType } from "./AnalysisFindingType";
import type { AnalyticsSnapshot } from "./AnalyticsSnapshot";
import type { AnalyzerType } from "./AnalyzerType";

/**
 * Domain-layer contract for analytics computation.
 *
 * IAnalyticsEngine accepts one or more FinancialMetricsSnapshots in
 * chronological order and returns an immutable AnalyticsSnapshot containing
 * all findings from all registered analyzers.
 *
 * The engine is pure and synchronous — it operates entirely on the data
 * passed to it. History retrieval and orchestration belong to IAnalyticsService.
 *
 * @depends-on AnalyticsRegistry, AnalyticsAnalyzer implementations
 * @see AnalyticsEngine for the concrete implementation
 */
export interface IAnalyticsEngine {
  /**
   * Run all registered analyzers against the provided snapshots (oldest first)
   * and return one immutable AnalyticsSnapshot.
   *
   * Analyzers that require more snapshots than provided are skipped (not failed).
   * Analyzers that throw are captured as AnalysisExecutionFailure entries.
   */
  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): AnalyticsSnapshot;

  /**
   * Return all findings of a specific type from an existing snapshot.
   * Pure lookup — does not re-run analyzers.
   */
  getFindingsByType(
    snapshot: AnalyticsSnapshot,
    type: AnalysisFindingType,
  ): ReadonlyArray<AnalyticsFinding>;

  isSupported(type: AnalyzerType): boolean;
  registeredTypes(): ReadonlyArray<AnalyzerType>;
}
