import type { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";
import type { FinancialHealthSection } from "./sections/FinancialHealthSection";
import type { AchievementsSection } from "./sections/AchievementsSection";
import type { RiskSection } from "./sections/RiskSection";
import type { GoalProgressSection } from "./sections/GoalProgressSection";
import type { RecommendationSection } from "./sections/RecommendationSection";
import type { CoachSummarySection } from "./sections/CoachSummarySection";
import type { NextMonthFocusSection } from "./sections/NextMonthFocusSection";

/**
 * Discriminated union of all FinancialReview section types.
 * Each section carries a string literal `type` discriminant.
 */
export type FinancialReviewSection =
  | ExecutiveSummarySection
  | FinancialHealthSection
  | AchievementsSection
  | RiskSection
  | GoalProgressSection
  | RecommendationSection
  | CoachSummarySection
  | NextMonthFocusSection;
