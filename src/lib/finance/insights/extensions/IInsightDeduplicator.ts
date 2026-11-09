import type { FinancialInsight } from "../FinancialInsight";

/**
 * Extension point: remove or merge duplicate FinancialInsights before
 * the snapshot is assembled.
 *
 * Useful when multiple generators fire on overlapping metric concerns
 * (e.g. both CashFlowInsightGenerator and SpendingMetricInsightGenerator
 * surface a high burn rate concern).
 */
export interface IInsightDeduplicator {
  /**
   * Return a deduplicated copy of `insights`.
   * MUST NOT mutate the input array.
   * The order of survivors is implementation-defined but SHOULD prefer
   * the insight with higher confidence.
   */
  deduplicate(insights: ReadonlyArray<FinancialInsight>): ReadonlyArray<FinancialInsight>;

  /**
   * Return true if `a` and `b` are considered duplicates.
   * Implementations may compare by metric type, category, or semantic
   * similarity of the title/summary.
   */
  areDuplicates(a: FinancialInsight, b: FinancialInsight): boolean;
}
