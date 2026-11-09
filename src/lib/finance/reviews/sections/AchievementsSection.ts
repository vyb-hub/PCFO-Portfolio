/**
 * Positive financial developments during the reporting period.
 * Answers: "What went well this month?"
 */
export interface AchievementsSection {
  readonly type: "ACHIEVEMENTS";
  /**
   * POSITIVE type insight IDs, sorted by confidence descending.
   * Represent metrics that are healthy and trending in a good direction.
   */
  readonly achievementInsightIds: ReadonlyArray<string>;
  /**
   * MILESTONE type insight IDs.
   * Represent significant thresholds crossed (e.g. emergency fund fully funded).
   */
  readonly milestoneInsightIds: ReadonlyArray<string>;
  readonly totalAchievements: number;
  readonly referencedInsightIds: ReadonlyArray<string>;
}
