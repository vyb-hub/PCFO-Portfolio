import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { IFinancialReviewService } from "./IFinancialReviewService";
import type { FinancialReview } from "./FinancialReview";
import type { FinancialReviewSummary } from "./FinancialReviewSummary";
import type { MetricType } from "../metrics/MetricType";
import { FinancialReviewBuilder } from "./FinancialReviewBuilder";

/**
 * Concrete implementation of IFinancialReviewService.
 *
 * Delegates all assembly to FinancialReviewBuilder.
 * Service methods provide cross-section queries over an assembled review.
 */
export class FinancialReviewService implements IFinancialReviewService {
  private readonly builder = new FinancialReviewBuilder();

  build(
    metricsSnapshot: FinancialMetricsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
    recommendationSnapshot: RecommendationSnapshot,
  ): FinancialReview {
    return this.builder.build(metricsSnapshot, insightSnapshot, recommendationSnapshot);
  }

  summarise(review: FinancialReview): FinancialReviewSummary {
    const exec = review.executiveSummary;
    return {
      id:                           review.id,
      userId:                       review.userId,
      period:                       review.period,
      generatedAt:                  review.generatedAt,
      overallHealthScore:           exec.overallHealthScore,
      healthTier:                   exec.healthTier,
      totalCriticalAndHighConcerns: exec.criticalInsightCount + exec.highInsightCount,
      achievementCount:             review.achievements.totalAchievements,
      urgentRecommendationCount:    exec.criticalRecommendationCount + exec.highRecommendationCount,
      topConcernInsightId:          exec.topConcernInsightId,
    };
  }

  allReferencedInsightIds(review: FinancialReview): ReadonlyArray<string> {
    return Object.freeze(Array.from(new Set([
      ...review.executiveSummary.referencedInsightIds,
      ...review.achievements.referencedInsightIds,
      ...review.risks.referencedInsightIds,
      ...review.goalProgress.referencedInsightIds,
      ...review.coachSummary.referencedInsightIds,
      ...review.nextMonthFocus.referencedInsightIds,
    ])));
  }

  allReferencedRecommendationIds(review: FinancialReview): ReadonlyArray<string> {
    return Object.freeze(Array.from(new Set([
      ...review.executiveSummary.referencedRecommendationIds,
      ...review.risks.referencedRecommendationIds,
      ...review.goalProgress.referencedRecommendationIds,
      ...review.recommendations.referencedRecommendationIds,
      ...review.coachSummary.referencedRecommendationIds,
      ...review.nextMonthFocus.referencedRecommendationIds,
    ])));
  }

  allReferencedMetricTypes(review: FinancialReview): ReadonlyArray<MetricType> {
    return Object.freeze(Array.from(new Set([
      ...review.financialHealth.referencedMetricTypes,
      ...review.coachSummary.referencedMetricTypes,
      ...review.nextMonthFocus.referencedMetricTypes,
    ])));
  }
}
