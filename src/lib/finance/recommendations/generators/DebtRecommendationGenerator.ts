import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";
import { MetricType } from "../../metrics/MetricType";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { RecommendationCategory } from "../RecommendationCategory";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { ImpactDimension } from "../RecommendationImpact";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";

const APPROACHING_PROXIMITY = 0.85; // within 15% of max threshold → approaching

/**
 * DebtRecommendationGenerator — detects unhealthy or approaching-threshold
 * debt metrics and generates structured debt-reduction recommendations.
 *
 * Signals consumed:
 *   DEBT_TO_INCOME_RATIO evaluation — breached → CRITICAL; approaching → HIGH
 *   CREDIT_UTILIZATION evaluation   — breached → HIGH
 */
export class DebtRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.DEBT,
    name:        "Debt Recommendation Generator",
    description: "Generates debt-reduction recommendations from DTI and credit utilisation metrics.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return DebtRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    const debtInsightIds = insightSnapshot.insights
      .filter((i) => i.category === InsightMetricCategory.DEBT || i.category === InsightMetricCategory.DEBT_TO_INCOME)
      .map((i) => i.id);

    const dtiEval = metricsSnapshot.evaluations.find(
      (e) => e.result.type === MetricType.DEBT_TO_INCOME_RATIO,
    );

    if (dtiEval) {
      const dtiFindingIds = analyticsSnapshot.findings
        .filter((f) => f.metricType === MetricType.DEBT_TO_INCOME_RATIO)
        .map((f) => f.id);

      if (!dtiEval.isHealthy) {
        const pct = (dtiEval.result.value * 100).toFixed(1);
        const maxPct = dtiEval.threshold.max !== null ? (dtiEval.threshold.max * 100).toFixed(0) : "43";
        recs.push({
          id:       "DEBT_DTI_EXCEEDED",
          category: RecommendationCategory.DEBT,
          priority: RecommendationPriority.CRITICAL,
          action:   RecommendationAction.ACCELERATE_DEBT_REPAYMENT,
          title:    "Debt-to-income ratio exceeds healthy limit",
          rationale:
            `The debt-to-income ratio of ${pct}% exceeds the ${maxPct}% ceiling. ` +
            "Total monthly debt obligations represent too large a share of income, " +
            "limiting financial flexibility and increasing vulnerability to income disruption.",
          impacts: [
            {
              dimension:      ImpactDimension.FINANCIAL,
              description:    "Reducing monthly debt obligations will improve cash flow and free up capacity for savings.",
              estimatedValue: null,
              impactScore:    85,
            },
            {
              dimension:      ImpactDimension.RISK,
              description:    "Lower DTI reduces the risk of debt default in the event of an income shock.",
              estimatedValue: null,
              impactScore:    80,
            },
          ],
          confidence:            RecommendationConfidence.HIGH,
          supportingInsightIds:  debtInsightIds,
          supportingFindingIds:  dtiFindingIds,
          supportingMetricTypes: [MetricType.DEBT_TO_INCOME_RATIO],
          generatedAt:           new Date(),
        });
      } else if (
        dtiEval.threshold.max !== null &&
        dtiEval.result.value / dtiEval.threshold.max >= APPROACHING_PROXIMITY
      ) {
        const pct = (dtiEval.result.value * 100).toFixed(1);
        recs.push({
          id:       "DEBT_DTI_APPROACHING",
          category: RecommendationCategory.DEBT,
          priority: RecommendationPriority.HIGH,
          action:   RecommendationAction.ACCELERATE_DEBT_REPAYMENT,
          title:    "Debt-to-income ratio approaching limit",
          rationale:
            `The debt-to-income ratio of ${pct}% is approaching the maximum healthy threshold. ` +
            "Proactively reducing debt now creates headroom before the limit is reached.",
          impacts: [
            {
              dimension:      ImpactDimension.FINANCIAL,
              description:    "Reducing debt now preserves borrowing capacity and financial flexibility.",
              estimatedValue: null,
              impactScore:    65,
            },
          ],
          confidence:            RecommendationConfidence.MEDIUM,
          supportingInsightIds:  debtInsightIds,
          supportingFindingIds:  dtiFindingIds,
          supportingMetricTypes: [MetricType.DEBT_TO_INCOME_RATIO],
          generatedAt:           new Date(),
        });
      }
    }

    const cuEval = metricsSnapshot.evaluations.find(
      (e) => e.result.type === MetricType.CREDIT_UTILIZATION,
    );

    if (cuEval && !cuEval.isHealthy) {
      const pct = (cuEval.result.value * 100).toFixed(1);
      const cuFindingIds = analyticsSnapshot.findings
        .filter((f) => f.metricType === MetricType.CREDIT_UTILIZATION)
        .map((f) => f.id);

      recs.push({
        id:       "DEBT_CREDIT_UTIL_HIGH",
        category: RecommendationCategory.DEBT,
        priority: RecommendationPriority.HIGH,
        action:   RecommendationAction.ACCELERATE_DEBT_REPAYMENT,
        title:    "Credit utilisation is too high",
        rationale:
          `Credit utilisation is at ${pct}%, above the healthy maximum. ` +
          "High credit utilisation signals over-reliance on credit and constrains access to additional credit.",
        impacts: [
          {
            dimension:      ImpactDimension.RISK,
            description:    "Reducing credit utilisation strengthens creditworthiness and reduces interest costs.",
            estimatedValue: null,
            impactScore:    70,
          },
        ],
        confidence:            RecommendationConfidence.HIGH,
        supportingInsightIds:  debtInsightIds,
        supportingFindingIds:  cuFindingIds,
        supportingMetricTypes: [MetricType.CREDIT_UTILIZATION],
        generatedAt:           new Date(),
      });
    }

    return recs;
  }
}
