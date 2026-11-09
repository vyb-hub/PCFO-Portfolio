/**
 * Risks and warnings requiring user attention during the reporting period.
 * Answers: "What is working against my financial health right now?"
 */
export interface RiskSection {
  readonly type: "RISKS";
  /**
   * RISK type insight IDs, sorted by severity (CRITICAL → LOW) then confidence descending.
   * Represent metrics outside their healthy range.
   */
  readonly riskInsightIds: ReadonlyArray<string>;
  /**
   * WARNING type insight IDs, sorted by severity then confidence descending.
   * Represent metrics that are healthy but deteriorating.
   */
  readonly warningInsightIds: ReadonlyArray<string>;
  /**
   * CRITICAL and HIGH priority recommendation IDs.
   * The urgent actions implied by the risk and warning insights.
   */
  readonly urgentRecommendationIds: ReadonlyArray<string>;
  readonly criticalRiskCount: number;
  readonly highRiskCount: number;
  readonly referencedInsightIds: ReadonlyArray<string>;
  readonly referencedRecommendationIds: ReadonlyArray<string>;
}
