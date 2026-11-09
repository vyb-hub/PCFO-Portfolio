import { randomUUID } from "crypto";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialInsight } from "../insights/FinancialInsight";
import type { Recommendation } from "../recommendations/Recommendation";
import type { FinancialReview } from "./FinancialReview";
import type { FinancialReviewMetadata } from "./FinancialReviewMetadata";
import type { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";
import type { FinancialHealthSection, MetricHealthEntry } from "./sections/FinancialHealthSection";
import type { AchievementsSection } from "./sections/AchievementsSection";
import type { RiskSection } from "./sections/RiskSection";
import type { GoalProgressSection } from "./sections/GoalProgressSection";
import type { RecommendationSection } from "./sections/RecommendationSection";
import type { CoachSummarySection } from "./sections/CoachSummarySection";
import type { NextMonthFocusSection } from "./sections/NextMonthFocusSection";
import { FinancialHealthTier } from "./FinancialHealthTier";
import { FINANCIAL_REVIEW_VERSION } from "./FinancialReview";
import { InsightType } from "../insights/InsightType";
import { InsightSeverityLevel } from "../insights/InsightSeverityLevel";
import { InsightMetricCategory } from "../insights/InsightMetricCategory";
import { RecommendationPriority } from "../recommendations/RecommendationPriority";
import { RecommendationCategory } from "../recommendations/RecommendationCategory";
import { formatSnapshotVersion } from "../metrics/snapshot/SnapshotVersion";

const SEVERITY_ORDER: Record<InsightSeverityLevel, number> = {
  [InsightSeverityLevel.CRITICAL]: 0,
  [InsightSeverityLevel.HIGH]:     1,
  [InsightSeverityLevel.MEDIUM]:   2,
  [InsightSeverityLevel.LOW]:      3,
};

function toHealthTier(score: number): FinancialHealthTier {
  if (score >= 0.85) return FinancialHealthTier.EXCELLENT;
  if (score >= 0.70) return FinancialHealthTier.GOOD;
  if (score >= 0.50) return FinancialHealthTier.FAIR;
  if (score >= 0.30) return FinancialHealthTier.NEEDS_ATTENTION;
  return FinancialHealthTier.CRITICAL;
}

/**
 * Assembles an immutable FinancialReview from three snapshot inputs.
 *
 * FinancialReviewBuilder contains no financial calculation logic.
 * It filters, sorts, and cross-references existing intelligence from
 * the input snapshots — nothing more.
 *
 * All section-building methods are pure functions over the snapshot data.
 */
export class FinancialReviewBuilder {
  build(
    metricsSnapshot: FinancialMetricsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
    recommendationSnapshot: RecommendationSnapshot,
  ): FinancialReview {
    const insights        = insightSnapshot.insights;
    const recommendations = recommendationSnapshot.recommendations;
    const evaluations     = metricsSnapshot.evaluations;

    const overallHealthScore = evaluations.length > 0
      ? evaluations.filter((e) => e.isHealthy).length / evaluations.length
      : 1.0;
    const healthTier = toHealthTier(overallHealthScore);

    const financialHealth = this.buildFinancialHealth(metricsSnapshot);
    const executiveSummary = this.buildExecutiveSummary(insights, recommendations, overallHealthScore, healthTier);
    const achievements     = this.buildAchievements(insights);
    const risks            = this.buildRisks(insights, recommendations);
    const goalProgress     = this.buildGoalProgress(insights, recommendations);
    const recsSection      = this.buildRecommendations(recommendations);
    const coachSummary     = this.buildCoachSummary(insights, recommendations, financialHealth, overallHealthScore, healthTier);
    const nextMonthFocus   = this.buildNextMonthFocus(insights, recommendations, financialHealth);

    const generatedAt = new Date();

    const metadata: FinancialReviewMetadata = {
      userId:                            metricsSnapshot.userId,
      generatedAt,
      metricsSnapshotGeneratedAt:        metricsSnapshot.metadata.generatedAt,
      insightSnapshotGeneratedAt:        insightSnapshot.generatedAt,
      recommendationSnapshotGeneratedAt: recommendationSnapshot.metadata.generatedAt,
      metricsSnapshotVersion:            formatSnapshotVersion(metricsSnapshot.metadata.version),
      insightSnapshotVersion:            insightSnapshot.snapshotVersion,
      totalMetricsConsidered:            evaluations.length,
      totalInsightsConsidered:           insights.length,
      totalRecommendationsConsidered:    recommendations.length,
    };

    return Object.freeze({
      id:              randomUUID(),
      userId:          metricsSnapshot.userId,
      period:          metricsSnapshot.period,
      generatedAt,
      snapshotVersion: FINANCIAL_REVIEW_VERSION,
      executiveSummary: Object.freeze(executiveSummary),
      financialHealth:  Object.freeze(financialHealth),
      achievements:     Object.freeze(achievements),
      risks:            Object.freeze(risks),
      goalProgress:     Object.freeze(goalProgress),
      recommendations:  Object.freeze(recsSection),
      coachSummary:     Object.freeze(coachSummary),
      nextMonthFocus:   Object.freeze(nextMonthFocus),
      metadata:         Object.freeze(metadata),
    });
  }

  private buildExecutiveSummary(
    insights: ReadonlyArray<FinancialInsight>,
    recommendations: ReadonlyArray<Recommendation>,
    overallHealthScore: number,
    healthTier: FinancialHealthTier,
  ): ExecutiveSummarySection {
    const criticalInsightCount = insights.filter((i) => i.severity === InsightSeverityLevel.CRITICAL).length;
    const highInsightCount     = insights.filter((i) => i.severity === InsightSeverityLevel.HIGH).length;
    const criticalRecCount     = recommendations.filter((r) => r.priority === RecommendationPriority.CRITICAL).length;
    const highRecCount         = recommendations.filter((r) => r.priority === RecommendationPriority.HIGH).length;

    const positiveSignals = insights.filter(
      (i) => i.type === InsightType.POSITIVE || i.type === InsightType.MILESTONE,
    );

    // Top concern: highest-severity RISK insight
    const topConcernInsight = insights
      .filter((i) => i.type === InsightType.RISK)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))[0];
    const topConcernInsightId = topConcernInsight?.id ?? null;

    // Top achievement: highest-confidence POSITIVE or MILESTONE insight
    const topAchievement = positiveSignals.sort((a, b) => b.confidence - a.confidence)[0];
    const topAchievementInsightId = topAchievement?.id ?? null;

    const referencedInsightIds: string[] = [];
    if (topConcernInsightId) referencedInsightIds.push(topConcernInsightId);
    if (topAchievementInsightId && topAchievementInsightId !== topConcernInsightId) {
      referencedInsightIds.push(topAchievementInsightId);
    }

    const criticalRecIds = recommendations
      .filter((r) => r.priority === RecommendationPriority.CRITICAL)
      .map((r) => r.id);

    return {
      type:                        "EXECUTIVE_SUMMARY",
      overallHealthScore,
      healthTier,
      criticalInsightCount,
      highInsightCount,
      criticalRecommendationCount: criticalRecCount,
      highRecommendationCount:     highRecCount,
      positiveSignalCount:         positiveSignals.length,
      topConcernInsightId,
      topAchievementInsightId,
      referencedInsightIds:        Object.freeze(referencedInsightIds),
      referencedRecommendationIds: Object.freeze(criticalRecIds),
    };
  }

  private buildFinancialHealth(
    metricsSnapshot: FinancialMetricsSnapshot,
  ): FinancialHealthSection {
    const metrics: MetricHealthEntry[] = metricsSnapshot.evaluations.map((e) => ({
      metricType:            e.result.type,
      isHealthy:             e.isHealthy,
      value:                 e.result.value,
      unit:                  e.result.unit,
      distanceFromThreshold: e.distanceFromThreshold,
    }));

    const healthyMetricCount   = metrics.filter((m) => m.isHealthy).length;
    const unhealthyMetricCount = metrics.filter((m) => !m.isHealthy).length;

    const unhealthyMetricTypes = metrics
      .filter((m) => !m.isHealthy)
      .sort((a, b) => Math.abs(b.distanceFromThreshold) - Math.abs(a.distanceFromThreshold))
      .map((m) => m.metricType);

    return {
      type:                  "FINANCIAL_HEALTH",
      healthyMetricCount,
      unhealthyMetricCount,
      metrics:               Object.freeze(metrics),
      unhealthyMetricTypes:  Object.freeze(unhealthyMetricTypes),
      referencedMetricTypes: Object.freeze(metrics.map((m) => m.metricType)),
    };
  }

  private buildAchievements(
    insights: ReadonlyArray<FinancialInsight>,
  ): AchievementsSection {
    const achievementInsightIds = insights
      .filter((i) => i.type === InsightType.POSITIVE)
      .sort((a, b) => b.confidence - a.confidence)
      .map((i) => i.id);

    const milestoneInsightIds = insights
      .filter((i) => i.type === InsightType.MILESTONE)
      .map((i) => i.id);

    const referencedInsightIds = [...achievementInsightIds, ...milestoneInsightIds];

    return {
      type:                  "ACHIEVEMENTS",
      achievementInsightIds: Object.freeze(achievementInsightIds),
      milestoneInsightIds:   Object.freeze(milestoneInsightIds),
      totalAchievements:     referencedInsightIds.length,
      referencedInsightIds:  Object.freeze(referencedInsightIds),
    };
  }

  private buildRisks(
    insights: ReadonlyArray<FinancialInsight>,
    recommendations: ReadonlyArray<Recommendation>,
  ): RiskSection {
    const riskInsightIds = insights
      .filter((i) => i.type === InsightType.RISK)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
      .map((i) => i.id);

    const warningInsightIds = insights
      .filter((i) => i.type === InsightType.WARNING)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
      .map((i) => i.id);

    const urgentRecommendationIds = recommendations
      .filter((r) =>
        r.priority === RecommendationPriority.CRITICAL ||
        r.priority === RecommendationPriority.HIGH,
      )
      .map((r) => r.id);

    const criticalRiskCount = insights.filter(
      (i) => i.type === InsightType.RISK && i.severity === InsightSeverityLevel.CRITICAL,
    ).length;
    const highRiskCount = insights.filter(
      (i) => i.type === InsightType.RISK && i.severity === InsightSeverityLevel.HIGH,
    ).length;

    return {
      type:                        "RISKS",
      riskInsightIds:              Object.freeze(riskInsightIds),
      warningInsightIds:           Object.freeze(warningInsightIds),
      urgentRecommendationIds:     Object.freeze(urgentRecommendationIds),
      criticalRiskCount,
      highRiskCount,
      referencedInsightIds:        Object.freeze([...riskInsightIds, ...warningInsightIds]),
      referencedRecommendationIds: Object.freeze(urgentRecommendationIds),
    };
  }

  private buildGoalProgress(
    insights: ReadonlyArray<FinancialInsight>,
    recommendations: ReadonlyArray<Recommendation>,
  ): GoalProgressSection {
    const goalInsightIds = insights
      .filter((i) => i.category === InsightMetricCategory.GOALS)
      .map((i) => i.id);

    const goalRecommendationIds = recommendations
      .filter((r) => r.category === RecommendationCategory.GOAL)
      .map((r) => r.id);

    const milestoneInsightIds = insights
      .filter((i) => i.type === InsightType.MILESTONE)
      .map((i) => i.id);

    const referencedInsightIds = Array.from(new Set([...goalInsightIds, ...milestoneInsightIds]));

    return {
      type:                        "GOAL_PROGRESS",
      goalInsightIds:              Object.freeze(goalInsightIds),
      goalRecommendationIds:       Object.freeze(goalRecommendationIds),
      milestoneInsightIds:         Object.freeze(milestoneInsightIds),
      referencedInsightIds:        Object.freeze(referencedInsightIds),
      referencedRecommendationIds: Object.freeze(goalRecommendationIds),
    };
  }

  private buildRecommendations(
    recommendations: ReadonlyArray<Recommendation>,
  ): RecommendationSection {
    const criticalRecommendationIds = recommendations
      .filter((r) => r.priority === RecommendationPriority.CRITICAL).map((r) => r.id);
    const highRecommendationIds     = recommendations
      .filter((r) => r.priority === RecommendationPriority.HIGH).map((r) => r.id);
    const mediumRecommendationIds   = recommendations
      .filter((r) => r.priority === RecommendationPriority.MEDIUM).map((r) => r.id);
    const lowRecommendationIds      = recommendations
      .filter((r) => r.priority === RecommendationPriority.LOW).map((r) => r.id);

    return {
      type:                        "RECOMMENDATION_SUMMARY",
      criticalRecommendationIds:   Object.freeze(criticalRecommendationIds),
      highRecommendationIds:       Object.freeze(highRecommendationIds),
      mediumRecommendationIds:     Object.freeze(mediumRecommendationIds),
      lowRecommendationIds:        Object.freeze(lowRecommendationIds),
      totalCount:                  recommendations.length,
      referencedRecommendationIds: Object.freeze(recommendations.map((r) => r.id)),
    };
  }

  private buildCoachSummary(
    insights: ReadonlyArray<FinancialInsight>,
    recommendations: ReadonlyArray<Recommendation>,
    financialHealth: FinancialHealthSection,
    overallHealthScore: number,
    healthTier: FinancialHealthTier,
  ): CoachSummarySection {
    const primaryInsightIds = insights
      .filter(
        (i) =>
          i.type === InsightType.RISK ||
          i.type === InsightType.WARNING ||
          i.type === InsightType.POSITIVE,
      )
      .sort((a, b) => {
        const severityDiff = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
        return severityDiff !== 0 ? severityDiff : b.confidence - a.confidence;
      })
      .slice(0, 5)
      .map((i) => i.id);

    const primaryRecommendationIds = recommendations
      .filter(
        (r) =>
          r.priority === RecommendationPriority.CRITICAL ||
          r.priority === RecommendationPriority.HIGH,
      )
      .slice(0, 3)
      .map((r) => r.id);

    const keyMetricTypes = financialHealth.unhealthyMetricTypes.slice(0, 5);

    return {
      type:                        "COACH_SUMMARY",
      primaryInsightIds:           Object.freeze(primaryInsightIds),
      primaryRecommendationIds:    Object.freeze(primaryRecommendationIds),
      keyMetricTypes:              Object.freeze(keyMetricTypes),
      isPositivePeriod:            overallHealthScore > 0.5,
      healthTier,
      referencedInsightIds:        Object.freeze(primaryInsightIds),
      referencedRecommendationIds: Object.freeze(primaryRecommendationIds),
      referencedMetricTypes:       Object.freeze(keyMetricTypes),
    };
  }

  private buildNextMonthFocus(
    insights: ReadonlyArray<FinancialInsight>,
    recommendations: ReadonlyArray<Recommendation>,
    financialHealth: FinancialHealthSection,
  ): NextMonthFocusSection {
    const priorityActionIds = recommendations
      .filter(
        (r) =>
          r.priority === RecommendationPriority.CRITICAL ||
          r.priority === RecommendationPriority.HIGH,
      )
      .map((r) => r.id);

    const activeRiskInsightIds = insights
      .filter((i) => i.type === InsightType.RISK)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
      .map((i) => i.id);

    const watchlistMetricTypes = financialHealth.unhealthyMetricTypes;

    return {
      type:                        "NEXT_MONTH_FOCUS",
      priorityActionIds:           Object.freeze(priorityActionIds),
      watchlistMetricTypes:        Object.freeze(watchlistMetricTypes),
      activeRiskInsightIds:        Object.freeze(activeRiskInsightIds),
      referencedRecommendationIds: Object.freeze(priorityActionIds),
      referencedInsightIds:        Object.freeze(activeRiskInsightIds),
      referencedMetricTypes:       Object.freeze(watchlistMetricTypes),
    };
  }
}
