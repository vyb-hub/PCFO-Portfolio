import type { FinancialHealthTier } from "../FinancialHealthTier";

/**
 * High-level summary of a reporting period.
 * Answers: "How is my overall financial health?"
 */
export interface ExecutiveSummarySection {
  readonly type: "EXECUTIVE_SUMMARY";
  /** Fraction of metric evaluations that are healthy (0.0–1.0). */
  readonly overallHealthScore: number;
  readonly healthTier: FinancialHealthTier;
  /** Count of CRITICAL severity insights. */
  readonly criticalInsightCount: number;
  /** Count of HIGH severity insights. */
  readonly highInsightCount: number;
  /** Count of CRITICAL priority recommendations. */
  readonly criticalRecommendationCount: number;
  /** Count of HIGH priority recommendations. */
  readonly highRecommendationCount: number;
  /** Count of POSITIVE and MILESTONE type insights. */
  readonly positiveSignalCount: number;
  /**
   * ID of the most important concern this period.
   * The highest-severity RISK insight; null if none.
   */
  readonly topConcernInsightId: string | null;
  /**
   * ID of the most important positive development.
   * Highest-confidence POSITIVE or MILESTONE insight; null if none.
   */
  readonly topAchievementInsightId: string | null;
  readonly referencedInsightIds: ReadonlyArray<string>;
  readonly referencedRecommendationIds: ReadonlyArray<string>;
}
