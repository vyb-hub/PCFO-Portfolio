import type { DateRange } from "../types/DateRange";
import type { AnalyticsFinding } from "./AnalyticsFinding";
import type { AnalyticsMetadata } from "./AnalyticsMetadata";

/**
 * A record of a single analyzer that threw during AnalyticsEngine.analyze().
 *
 * Captured failures do not abort the analytics run — partial snapshots
 * (some analyzers succeeded, some failed) are still valid and usable.
 */
export interface AnalysisExecutionFailure {
  readonly analyzerName: string;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

/**
 * An immutable point-in-time record of all analytical observations
 * derived from one or more FinancialMetricsSnapshots.
 *
 * AnalyticsSnapshot is the official contract between the Analytics Platform
 * and all downstream layers (Insight Platform, Recommendation Platform,
 * AI Coach, Dashboard, Reporting).
 *
 * No downstream layer should access AnalyticsAnalyzer implementations directly.
 * No downstream layer needs to know how many historical snapshots existed,
 * which analyzers ran, or where the history was stored.
 *
 * Construction:
 *   const snapshot = new AnalyticsEngine(registry).analyze(snapshots);
 *
 * Access:
 *   service.getFindingsByType(snapshot, AnalysisFindingType.RISK)
 *   service.getFindingsByMetric(snapshot, MetricType.SAVINGS_RATE)
 */
export interface AnalyticsSnapshot {
  readonly userId: string;
  /**
   * The full time span covered by all snapshots fed into the engine.
   * start = earliest snapshot period start; end = most recent period end.
   */
  readonly analysisWindow: DateRange;
  readonly metadata: AnalyticsMetadata;
  /** All findings from all successful analyzers, in production order. */
  readonly findings: ReadonlyArray<AnalyticsFinding>;
  /** Analyzers that threw during execution. Does not include skipped analyzers. */
  readonly failures: ReadonlyArray<AnalysisExecutionFailure>;
}
