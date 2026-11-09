/**
 * Structured view of all financial recommendations for the reporting period.
 * Answers: "What actions should I take, and how urgently?"
 */
export interface RecommendationSection {
  readonly type: "RECOMMENDATION_SUMMARY";
  readonly criticalRecommendationIds: ReadonlyArray<string>;
  readonly highRecommendationIds: ReadonlyArray<string>;
  readonly mediumRecommendationIds: ReadonlyArray<string>;
  readonly lowRecommendationIds: ReadonlyArray<string>;
  readonly totalCount: number;
  readonly referencedRecommendationIds: ReadonlyArray<string>;
}
