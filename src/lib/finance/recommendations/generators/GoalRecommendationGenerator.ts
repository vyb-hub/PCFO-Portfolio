import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";
import { MetricType } from "../../metrics/MetricType";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { RecommendationCategory } from "../RecommendationCategory";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { ImpactDimension } from "../RecommendationImpact";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";

/**
 * GoalRecommendationGenerator — detects goal progress signals and generates
 * recommendations to protect or accelerate wealth accumulation.
 *
 * Signals consumed:
 *   GOALS insights — declining net worth → HIGH: INCREASE_SAVINGS
 *   SAVINGS_VELOCITY_LOW insight — savings inconsistent → HIGH: INCREASE_SAVINGS
 *   Positive goals + savings opportunity → LOW: INCREASE_INVESTMENT
 */
export class GoalRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.GOAL,
    name:        "Goal Recommendation Generator",
    description: "Generates wealth-building recommendations from goal progress and net worth insights.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return GoalRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    const netWorthFindingIds = analyticsSnapshot.findings
      .filter((f) => f.metricType === MetricType.NET_WORTH)
      .map((f) => f.id);

    // Net worth declining — find by category + risk/warning type
    const netWorthDecliningInsight = insightSnapshot.insights.find(
      (i) =>
        i.category === InsightMetricCategory.NET_WORTH &&
        (i.type === InsightType.RISK || i.type === InsightType.WARNING),
    );
    if (netWorthDecliningInsight) {
      recs.push({
        id:       "GOAL_NET_WORTH_DECLINING",
        category: RecommendationCategory.GOAL,
        priority: RecommendationPriority.HIGH,
        action:   RecommendationAction.INCREASE_SAVINGS,
        title:    "Net worth is declining — wealth is contracting",
        rationale:
          "Net worth has decreased over the analysis period. " +
          "Reversing this requires either increasing income, reducing spending, or both. " +
          "Protecting and growing net worth is the foundation of long-term financial security.",
        impacts: [
          {
            dimension:      ImpactDimension.GOAL_PROGRESS,
            description:    "Stabilising and growing net worth is the primary measure of financial progress.",
            estimatedValue: null,
            impactScore:    85,
          },
          {
            dimension:      ImpactDimension.FINANCIAL,
            description:    "Halting the decline prevents compounding deterioration of the wealth base.",
            estimatedValue: null,
            impactScore:    80,
          },
        ],
        confidence:            RecommendationConfidence.HIGH,
        supportingInsightIds:  [netWorthDecliningInsight.id],
        supportingFindingIds:  netWorthFindingIds,
        supportingMetricTypes: [MetricType.NET_WORTH],
        generatedAt:           new Date(),
      });
    }

    // Savings velocity low — savings inconsistent, find by GOALS category + risk/warning type
    const velocityInsight = insightSnapshot.insights.find(
      (i) =>
        i.category === InsightMetricCategory.GOALS &&
        (i.type === InsightType.RISK || i.type === InsightType.WARNING),
    );
    if (velocityInsight && !netWorthDecliningInsight) {
      recs.push({
        id:       "GOAL_SAVINGS_VELOCITY_IMPROVE",
        category: RecommendationCategory.GOAL,
        priority: RecommendationPriority.MEDIUM,
        action:   RecommendationAction.INCREASE_SAVINGS,
        title:    "Savings consistency limits goal progress",
        rationale:
          "A positive savings rate was achieved in fewer than half of tracked periods. " +
          "Irregular saving makes it difficult to build toward medium and long-term goals.",
        impacts: [
          {
            dimension:      ImpactDimension.GOAL_PROGRESS,
            description:    "Regular savings — even modest amounts — compounds more effectively over time.",
            estimatedValue: null,
            impactScore:    65,
          },
        ],
        confidence:            RecommendationConfidence.MEDIUM,
        supportingInsightIds:  [velocityInsight.id],
        supportingFindingIds:  [],
        supportingMetricTypes: [MetricType.SAVINGS_RATE],
        generatedAt:           new Date(),
      });
    }

    return recs;
  }
}
