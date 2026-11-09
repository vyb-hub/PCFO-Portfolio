import type { AggregatePeriod } from "../aggregation/AggregatePeriod";
import type { FinancialReviewMetadata } from "./FinancialReviewMetadata";
import type { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";
import type { FinancialHealthSection } from "./sections/FinancialHealthSection";
import type { AchievementsSection } from "./sections/AchievementsSection";
import type { RiskSection } from "./sections/RiskSection";
import type { GoalProgressSection } from "./sections/GoalProgressSection";
import type { RecommendationSection } from "./sections/RecommendationSection";
import type { CoachSummarySection } from "./sections/CoachSummarySection";
import type { NextMonthFocusSection } from "./sections/NextMonthFocusSection";

export const FINANCIAL_REVIEW_VERSION = "1.0.0" as const;

/**
 * An immutable, structured summary of a user's financial state for a reporting period.
 *
 * FinancialReview is assembled by FinancialReviewBuilder from three snapshot inputs:
 *   FinancialMetricsSnapshot + FinancialInsightSnapshot + RecommendationSnapshot
 *
 * It does NOT recalculate metrics, re-generate insights, or produce recommendations.
 * It organises existing intelligence into a form that downstream consumers
 * (Dashboard, AI Coach, PDF export, Email summary) can render without repeating
 * any financial business logic.
 *
 * Construction:
 *   const review = new FinancialReviewBuilder().build(metrics, insights, recommendations);
 *
 * Downstream rendering:
 *   - Dashboard:  read sections directly; all IDs cross-reference the source snapshots
 *   - AI Coach:   consume coachSummary for structured narrative inputs
 *   - PDF/Email:  iterate all sections; no recalculation required
 */
export interface FinancialReview {
  /** Stable identifier for this review. Generated once at build time. */
  readonly id: string;
  readonly userId: string;
  /** The reporting period inherited from FinancialMetricsSnapshot.period. */
  readonly period: AggregatePeriod;
  readonly generatedAt: Date;
  readonly snapshotVersion: string;

  readonly executiveSummary: ExecutiveSummarySection;
  readonly financialHealth: FinancialHealthSection;
  readonly achievements: AchievementsSection;
  readonly risks: RiskSection;
  readonly goalProgress: GoalProgressSection;
  readonly recommendations: RecommendationSection;
  readonly coachSummary: CoachSummarySection;
  readonly nextMonthFocus: NextMonthFocusSection;

  readonly metadata: FinancialReviewMetadata;
}
