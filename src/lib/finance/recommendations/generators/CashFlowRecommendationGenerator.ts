import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";
import { MetricType } from "../../metrics/MetricType";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { TrendDirection } from "../../analytics/TrendDirection";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { RecommendationCategory } from "../RecommendationCategory";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { ImpactDimension } from "../RecommendationImpact";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";

/**
 * CashFlowRecommendationGenerator — detects negative or deteriorating cash flow
 * and generates structured spending-reduction or budgeting recommendations.
 *
 * Signals consumed:
 *   CASH_FLOW evaluation — negative → CRITICAL: REDUCE_SPENDING
 *   CASH_FLOW trend finding — DECLINING → HIGH: CREATE_BUDGET
 */
export class CashFlowRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.CASH_FLOW,
    name:        "Cash Flow Recommendation Generator",
    description: "Generates cash flow recommendations from cash flow metric and trend findings.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return CashFlowRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    const cashFlowInsightIds = insightSnapshot.insights
      .filter((i) => i.category === InsightMetricCategory.CASH_FLOW)
      .map((i) => i.id);

    const cfEval = metricsSnapshot.evaluations.find(
      (e) => e.result.type === MetricType.CASH_FLOW,
    );

    if (cfEval && !cfEval.isHealthy) {
      // EC-011A context calibration: a deficit under 2 % of monthly burn is marginal
      // (e.g. ₹1,600 overspend on ₹2L income) and warrants HIGH, not CRITICAL.
      // Deficits ≥ 2 % of burn are material and remain CRITICAL.
      const burnEval = metricsSnapshot.evaluations.find(
        (e) => e.result.type === MetricType.BURN_RATE,
      );
      const burnRate = burnEval?.result.value ?? 0;
      const deficit  = Math.abs(cfEval.result.value);
      const isMarginal = burnRate > 0 && deficit / burnRate < 0.02;

      recs.push({
        id:       "CASH_FLOW_NEGATIVE",
        category: RecommendationCategory.CASH_FLOW,
        priority: isMarginal ? RecommendationPriority.HIGH : RecommendationPriority.CRITICAL,
        action:   RecommendationAction.REDUCE_SPENDING,
        title:    isMarginal
          ? "Cash flow is marginally negative"
          : "Cash flow is negative — spending exceeds income",
        rationale: isMarginal
          ? "Total outflows slightly exceed total income for the period. " +
            "The deficit is small relative to monthly spending but should be monitored — " +
            "even a marginal outflow, if sustained, gradually erodes reserves."
          : "Total outflows exceed total income for the period. " +
            "A sustained deficit depletes savings and increases reliance on credit or debt.",
        impacts: [
          {
            dimension:      ImpactDimension.FINANCIAL,
            description:    "Eliminating the deficit prevents erosion of savings or accumulation of new debt.",
            estimatedValue: null,
            impactScore:    95,
          },
          {
            dimension:      ImpactDimension.RISK,
            description:    "Restoring positive cash flow removes the immediate risk of insolvency.",
            estimatedValue: null,
            impactScore:    90,
          },
        ],
        confidence:            RecommendationConfidence.HIGH,
        supportingInsightIds:  cashFlowInsightIds,
        supportingFindingIds:  analyticsSnapshot.findings
          .filter((f) => f.metricType === MetricType.CASH_FLOW)
          .map((f) => f.id),
        supportingMetricTypes: [MetricType.CASH_FLOW],
        generatedAt:           new Date(),
      });
    }

    // Declining cash flow trend — not yet negative but heading there
    const cfTrendFinding = analyticsSnapshot.findings.find(
      (f) =>
        f.type === AnalysisFindingType.TREND &&
        f.metricType === MetricType.CASH_FLOW &&
        f.direction === TrendDirection.DECLINING,
    );

    if (cfTrendFinding && (cfEval?.isHealthy ?? true)) {
      recs.push({
        id:       "CASH_FLOW_DECLINING_TREND",
        category: RecommendationCategory.CASH_FLOW,
        priority: RecommendationPriority.HIGH,
        action:   RecommendationAction.CREATE_BUDGET,
        title:    "Cash flow is declining",
        rationale:
          "Cash flow is on a downward trend. Without intervention, outflows may exceed income in future periods. " +
          "A structured budget creates visibility and identifies where spending can be controlled.",
        impacts: [
          {
            dimension:      ImpactDimension.BEHAVIOURAL,
            description:    "A budget provides structure that can halt and reverse the deterioration.",
            estimatedValue: null,
            impactScore:    70,
          },
          {
            dimension:      ImpactDimension.FINANCIAL,
            description:    "Arresting the decline preserves savings capacity.",
            estimatedValue: null,
            impactScore:    65,
          },
        ],
        confidence:            RecommendationConfidence.MEDIUM,
        supportingInsightIds:  cashFlowInsightIds,
        supportingFindingIds:  [cfTrendFinding.id],
        supportingMetricTypes: [MetricType.CASH_FLOW],
        generatedAt:           new Date(),
      });
    }

    return recs;
  }
}
