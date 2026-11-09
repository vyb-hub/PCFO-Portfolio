/**
 * Goal-related financial signals from the reporting period.
 * Answers: "Am I making progress toward my financial goals?"
 */
export interface GoalProgressSection {
  readonly type: "GOAL_PROGRESS";
  /**
   * GOALS category insight IDs — observations about savings velocity,
   * net worth trajectory, and goal-relevant metrics.
   */
  readonly goalInsightIds: ReadonlyArray<string>;
  /**
   * GOAL category recommendation IDs — actions to improve goal progress.
   */
  readonly goalRecommendationIds: ReadonlyArray<string>;
  /**
   * MILESTONE insight IDs — significant thresholds crossed this period.
   */
  readonly milestoneInsightIds: ReadonlyArray<string>;
  readonly referencedInsightIds: ReadonlyArray<string>;
  readonly referencedRecommendationIds: ReadonlyArray<string>;
}
