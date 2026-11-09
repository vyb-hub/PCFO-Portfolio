import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsFinding } from "./AnalyticsFinding";
import type { AnalyzerDefinition } from "./AnalyzerDefinition";

/**
 * Plugin interface for all analytics analyzers.
 *
 * An analyzer receives a chronologically-ordered list of FinancialMetricsSnapshots
 * (oldest first, most recent last) and returns a list of findings.
 *
 * Constraints:
 *   - Analyzers must be pure and deterministic.
 *   - Analyzers must not access repositories, transactions, or AI.
 *   - Analyzers must not compute financial metrics — they read pre-computed
 *     MetricResult values from the snapshots.
 *
 * Implementing a new analyzer:
 *   1. Create a class implementing AnalyticsAnalyzer.
 *   2. Declare DEFINITION with minimumSnapshots ≥ 1.
 *   3. Register it in createDefaultAnalyticsEngine().
 *   The AnalyticsEngine never needs to change.
 */
export interface AnalyticsAnalyzer {
  /**
   * Static metadata for this analyzer. Called by AnalyticsRegistry at
   * registration time. Must return the same value on every call.
   */
  definition(): AnalyzerDefinition;

  /**
   * Analyze a chronologically-ordered list of snapshots and return findings.
   *
   * The engine guarantees:
   *   - snapshots.length ≥ definition().minimumSnapshots
   *   - snapshots are sorted oldest-first by period.range.end
   *   - snapshots all belong to the same userId
   *
   * Implementations should return an empty array (never throw) when the
   * data is insufficient or a finding is not applicable.
   */
  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding>;
}
