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
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";

/**
 * SavingsRecommendationGenerator — detects insufficient savings and generates
 * structured recommendations to increase saving or reduce spending pressure.
 *
 * Signals consumed:
 *   SAVINGS_RATE evaluation — breached minimum → CRITICAL; approaching → MEDIUM
 *   SAVINGS_COMPRESSION insight — savings being squeezed → HIGH: REDUCE_SPENDING
 *   SAVINGS_VELOCITY_LOW insight — inconsistent saving → MEDIUM: INCREASE_SAVINGS
 */
export class SavingsRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.SAVINGS,
    name:        "Savings Recommendation Generator",
    description: "Generates savings-improvement recommendations from savings rate metrics and insights.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return SavingsRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    const savingsInsightIds = insightSnapshot.insights
      .filter((i) => i.category === InsightMetricCategory.SAVINGS)
      .map((i) => i.id);

    const savingsFindingIds = analyticsSnapshot.findings
      .filter((f) => f.metricType === MetricType.SAVINGS_RATE)
      .map((f) => f.id);

    const srEval = metricsSnapshot.evaluations.find(
      (e) => e.result.type === MetricType.SAVINGS_RATE,
    );

    if (srEval) {
      if (!srEval.isHealthy) {
        const pct = (srEval.result.value * 100).toFixed(1);
        const minPct = srEval.threshold.min !== null ? (srEval.threshold.min * 100).toFixed(0) : "10";

        // Derive priority from the savings insight severity (EC-011A context calibration).
        // SavingsInsightGenerator uses rangeRef=0.5, so CRITICAL only fires when the savings
        // rate is ≥ 25 percentage points below the threshold (≥ -15% absolute). For smaller
        // deficits the insight is MEDIUM/HIGH → map to HIGH recommendation priority.
        const srInsight = insightSnapshot.insights.find(
          (i) => i.category === InsightMetricCategory.SAVINGS && i.type === InsightType.RISK,
        );
        const priority =
          srInsight?.severity === InsightSeverityLevel.CRITICAL
            ? RecommendationPriority.CRITICAL
            : RecommendationPriority.HIGH;

        recs.push({
          id:       "SAVINGS_RATE_BELOW_MINIMUM",
          category: RecommendationCategory.SAVINGS,
          priority,
          action:   RecommendationAction.INCREASE_SAVINGS,
          title:    "Savings rate is below the minimum healthy level",
          rationale:
            `The savings rate of ${pct}% is below the ${minPct}% minimum. ` +
            "A low savings rate leaves insufficient buffer for emergencies and makes " +
            "long-term wealth accumulation very slow.",
          impacts: [
            {
              dimension:      ImpactDimension.FINANCIAL,
              description:    "Increasing the savings rate directly accelerates wealth accumulation.",
              estimatedValue: null,
              impactScore:    90,
            },
            {
              dimension:      ImpactDimension.RISK,
              description:    "Higher savings builds resilience against unexpected expenses.",
              estimatedValue: null,
              impactScore:    75,
            },
          ],
          confidence:            RecommendationConfidence.HIGH,
          supportingInsightIds:  savingsInsightIds,
          supportingFindingIds:  savingsFindingIds,
          supportingMetricTypes: [MetricType.SAVINGS_RATE],
          generatedAt:           new Date(),
        });
      } else if (
        srEval.threshold.min !== null &&
        srEval.result.value <= srEval.threshold.min * 1.15
      ) {
        const pct = (srEval.result.value * 100).toFixed(1);
        recs.push({
          id:       "SAVINGS_RATE_APPROACHING_MINIMUM",
          category: RecommendationCategory.SAVINGS,
          priority: RecommendationPriority.MEDIUM,
          action:   RecommendationAction.INCREASE_SAVINGS,
          title:    "Savings rate is close to the minimum threshold",
          rationale:
            `The savings rate of ${pct}% is only marginally above the minimum healthy level. ` +
            "Modest improvements now provide a meaningful buffer before the threshold is breached.",
          impacts: [
            {
              dimension:      ImpactDimension.FINANCIAL,
              description:    "Strengthening the savings rate provides a buffer for income variation.",
              estimatedValue: null,
              impactScore:    55,
            },
          ],
          confidence:            RecommendationConfidence.MEDIUM,
          supportingInsightIds:  savingsInsightIds,
          supportingFindingIds:  savingsFindingIds,
          supportingMetricTypes: [MetricType.SAVINGS_RATE],
          generatedAt:           new Date(),
        });
      }
    }

    // Savings compression — healthy but declining; find by SAVINGS + WARNING type
    const compressionInsight = insightSnapshot.insights.find(
      (i) => i.category === InsightMetricCategory.SAVINGS && i.type === InsightType.WARNING,
    );
    if (compressionInsight) {
      recs.push({
        id:       "SAVINGS_COMPRESSION_REDUCE_SPEND",
        category: RecommendationCategory.SAVINGS,
        priority: RecommendationPriority.HIGH,
        action:   RecommendationAction.REDUCE_SPENDING,
        title:    "Spending growth is compressing savings",
        rationale:
          "Spending is growing faster than income, squeezing the savings rate downward. " +
          "Reducing discretionary spending creates room for savings to recover.",
        impacts: [
          {
            dimension:      ImpactDimension.FINANCIAL,
            description:    "Slowing spending growth directly increases the portion of income available to save.",
            estimatedValue: null,
            impactScore:    75,
          },
          {
            dimension:      ImpactDimension.BEHAVIOURAL,
            description:    "Reversing the spending growth trend establishes a more sustainable financial rhythm.",
            estimatedValue: null,
            impactScore:    60,
          },
        ],
        confidence:            compressionInsight.confidence >= 0.70 ? RecommendationConfidence.HIGH : RecommendationConfidence.MEDIUM,
        supportingInsightIds:  [compressionInsight.id],
        supportingFindingIds:  analyticsSnapshot.findings
          .filter((f) => f.id === "SAVINGS_COMPRESSION")
          .map((f) => f.id),
        supportingMetricTypes: [MetricType.SAVINGS_RATE, MetricType.BURN_RATE],
        generatedAt:           new Date(),
      });
    }

    // Low savings velocity — savings below minimum; find by SAVINGS + RISK type
    const velocityInsight = insightSnapshot.insights.find(
      (i) => i.category === InsightMetricCategory.SAVINGS && i.type === InsightType.RISK,
    );
    if (velocityInsight) {
      recs.push({
        id:       "SAVINGS_VELOCITY_IMPROVE_CONSISTENCY",
        category: RecommendationCategory.SAVINGS,
        priority: RecommendationPriority.MEDIUM,
        action:   RecommendationAction.INCREASE_SAVINGS,
        title:    "Savings are inconsistent across periods",
        rationale:
          "A positive savings rate was achieved in fewer than half of the tracked periods. " +
          "Consistent saving — even in smaller amounts — compounds more effectively than " +
          "irregular large contributions.",
        impacts: [
          {
            dimension:      ImpactDimension.BEHAVIOURAL,
            description:    "Building a regular savings habit smooths out income and spending variability.",
            estimatedValue: null,
            impactScore:    65,
          },
          {
            dimension:      ImpactDimension.GOAL_PROGRESS,
            description:    "Consistent savings directly accelerates progress toward financial goals.",
            estimatedValue: null,
            impactScore:    70,
          },
        ],
        confidence:            RecommendationConfidence.MEDIUM,
        supportingInsightIds:  [velocityInsight.id],
        supportingFindingIds:  analyticsSnapshot.findings
          .filter((f) => f.id === "SAVINGS_VELOCITY_LOW")
          .map((f) => f.id),
        supportingMetricTypes: [MetricType.SAVINGS_RATE],
        generatedAt:           new Date(),
      });
    }

    return recs;
  }
}
