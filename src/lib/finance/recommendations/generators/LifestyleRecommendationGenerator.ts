import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";
import { MetricType } from "../../metrics/MetricType";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { RecommendationCategory } from "../RecommendationCategory";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { ImpactDimension } from "../RecommendationImpact";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";

/**
 * LifestyleRecommendationGenerator — detects behavioural spending patterns and
 * generates recommendations to reduce fixed costs or plan for seasonal spikes.
 *
 * Signals consumed:
 *   RECURRING_SPEND_CREEP insight  → MEDIUM: REDUCE_RECURRING_COSTS
 *   SEASONALITY findings           → LOW: CREATE_BUDGET (plan for seasonal spikes)
 */
export class LifestyleRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.LIFESTYLE,
    name:        "Lifestyle Recommendation Generator",
    description: "Generates spending behaviour recommendations from recurring cost and seasonality patterns.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return LifestyleRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    // Recurring spend creep — find by SPENDING category + warning/risk type
    const creepInsight = insightSnapshot.insights.find(
      (i) =>
        i.category === InsightMetricCategory.SPENDING &&
        (i.type === InsightType.WARNING || i.type === InsightType.RISK),
    );
    if (creepInsight) {
      recs.push({
        id:       "LIFESTYLE_RECURRING_SPEND_CREEP",
        category: RecommendationCategory.LIFESTYLE,
        priority: RecommendationPriority.MEDIUM,
        action:   RecommendationAction.REDUCE_RECURRING_COSTS,
        title:    "Recurring costs are growing as a share of spending",
        rationale:
          "Fixed recurring expenses are claiming an increasing proportion of total spending. " +
          "As these commitments compound, they leave less flexibility for variable and discretionary spending.",
        impacts: [
          {
            dimension:      ImpactDimension.BEHAVIOURAL,
            description:    "Reviewing and trimming recurring commitments reverses the creep and restores spending flexibility.",
            estimatedValue: null,
            impactScore:    65,
          },
          {
            dimension:      ImpactDimension.FINANCIAL,
            description:    "Reducing fixed costs directly improves savings capacity.",
            estimatedValue: null,
            impactScore:    60,
          },
        ],
        confidence:            creepInsight.confidence >= 0.70 ? RecommendationConfidence.HIGH : RecommendationConfidence.MEDIUM,
        supportingInsightIds:  [creepInsight.id],
        supportingFindingIds:  analyticsSnapshot.findings
          .filter((f) => f.id === "RECURRING_SPEND_CREEP")
          .map((f) => f.id),
        supportingMetricTypes: [MetricType.RECURRING_SPEND, MetricType.BURN_RATE],
        generatedAt:           new Date(),
      });
    }

    // Seasonal spending pattern — plan ahead
    const seasonalityFindings = analyticsSnapshot.findings.filter(
      (f) => f.type === AnalysisFindingType.SEASONALITY,
    );
    const seasonalityInsightIds = insightSnapshot.insights
      .filter((i) => i.category === InsightMetricCategory.SPENDING && i.id.includes("SEASONALITY"))
      .map((i) => i.id);

    if (seasonalityFindings.length > 0) {
      recs.push({
        id:       "LIFESTYLE_SEASONAL_BUDGET_PLAN",
        category: RecommendationCategory.LIFESTYLE,
        priority: RecommendationPriority.LOW,
        action:   RecommendationAction.CREATE_BUDGET,
        title:    "Seasonal spending pattern detected — plan ahead",
        rationale:
          "A recurring quarterly or seasonal spending pattern has been identified. " +
          "Knowing when spending historically spikes allows for proactive budgeting " +
          "to avoid cash shortfalls during high-spend periods.",
        impacts: [
          {
            dimension:      ImpactDimension.BEHAVIOURAL,
            description:    "Anticipating seasonal spikes prevents reactive overspending.",
            estimatedValue: null,
            impactScore:    50,
          },
        ],
        confidence:            RecommendationConfidence.LOW,
        supportingInsightIds:  seasonalityInsightIds,
        supportingFindingIds:  seasonalityFindings.map((f) => f.id),
        supportingMetricTypes: [MetricType.BURN_RATE, MetricType.RECURRING_SPEND],
        generatedAt:           new Date(),
      });
    }

    return recs;
  }
}
