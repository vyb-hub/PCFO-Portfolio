import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";
import { MetricType } from "../../metrics/MetricType";
import { InsightType } from "../../insights/InsightType";
import { RecommendationCategory } from "../RecommendationCategory";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { ImpactDimension } from "../RecommendationImpact";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";

/**
 * InvestmentRecommendationGenerator — surfaces investment opportunities when
 * the financial position is healthy and improving.
 *
 * Investment recommendations are only generated when multiple positive signals
 * align — never in isolation from other financial health indicators.
 *
 * Signals consumed:
 *   OPPORTUNITY insights — multi-metric positive convergence → LOW: INCREASE_INVESTMENT
 *   Healthy savings rate + positive cash flow + growing net worth → LOW: INCREASE_INVESTMENT
 */
export class InvestmentRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.INVESTMENT,
    name:        "Investment Recommendation Generator",
    description: "Surfaces investment opportunities when the financial position is healthy.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return InvestmentRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    const opportunityInsights = insightSnapshot.insights.filter(
      (i) => i.type === InsightType.OPPORTUNITY,
    );

    if (opportunityInsights.length === 0) return recs;

    // Only recommend investing when cash flow is positive and savings rate is healthy
    const cfEval  = metricsSnapshot.evaluations.find((e) => e.result.type === MetricType.CASH_FLOW);
    const srEval  = metricsSnapshot.evaluations.find((e) => e.result.type === MetricType.SAVINGS_RATE);

    const cashFlowPositive   = cfEval ? cfEval.isHealthy : false;
    const savingsRateHealthy = srEval ? srEval.isHealthy : false;

    if (!cashFlowPositive || !savingsRateHealthy) return recs;

    const netWorthFindingIds = analyticsSnapshot.findings
      .filter((f) => f.metricType === MetricType.NET_WORTH)
      .map((f) => f.id);

    recs.push({
      id:       "INVESTMENT_OPPORTUNITY_MULTI_SIGNAL",
      category: RecommendationCategory.INVESTMENT,
      priority: RecommendationPriority.LOW,
      action:   RecommendationAction.INCREASE_INVESTMENT,
      title:    "Financial position supports increased investment",
      rationale:
        "Multiple financial metrics are improving simultaneously — savings rate is healthy, " +
        "cash flow is positive, and a positive multi-metric convergence has been detected. " +
        "The current position is a suitable foundation for directing surplus capital toward investment.",
      impacts: [
        {
          dimension:      ImpactDimension.GOAL_PROGRESS,
          description:    "Increasing investment allocation accelerates long-term wealth accumulation.",
          estimatedValue: null,
          impactScore:    70,
        },
        {
          dimension:      ImpactDimension.FINANCIAL,
          description:    "Investing surplus capital rather than holding cash puts money to work.",
          estimatedValue: null,
          impactScore:    65,
        },
      ],
      confidence:            RecommendationConfidence.MEDIUM,
      supportingInsightIds:  opportunityInsights.map((i) => i.id),
      supportingFindingIds:  netWorthFindingIds,
      supportingMetricTypes: [MetricType.SAVINGS_RATE, MetricType.CASH_FLOW, MetricType.NET_WORTH],
      generatedAt:           new Date(),
    });

    return recs;
  }
}
