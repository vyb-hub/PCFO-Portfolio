import type { FinancialInsight } from "../FinancialInsight";

/**
 * Extension point: apply a custom ranking or priority score to a set
 * of FinancialInsights.
 *
 * The default engine sorts by severity then type. An IInsightRanker can
 * apply user-preference signals, recency weighting, or ML-based scores
 * on top of that base ordering.
 */
export interface IInsightRanker {
  /**
   * Return a copy of `insights` sorted by this ranker's priority criteria.
   * MUST NOT mutate the input array.
   */
  rank(insights: ReadonlyArray<FinancialInsight>): ReadonlyArray<FinancialInsight>;

  /**
   * Assign a numeric priority score to a single insight.
   * Higher score = higher priority. Used when insights are merged from
   * multiple sources before re-ranking.
   */
  score(insight: FinancialInsight): number;
}
