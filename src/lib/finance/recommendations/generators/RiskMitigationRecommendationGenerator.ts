import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";
import { MetricType } from "../../metrics/MetricType";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { RecommendationCategory } from "../RecommendationCategory";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { ImpactDimension } from "../RecommendationImpact";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";

/**
 * RiskMitigationRecommendationGenerator — synthesises multiple risk signals
 * into emergency fund and risk-reduction recommendations.
 *
 * Signals consumed:
 *   Multiple CRITICAL insights        → CRITICAL: BUILD_EMERGENCY_FUND
 *   RISK category insights (WARNING+) → HIGH: BUILD_EMERGENCY_FUND
 *   RISK analytics findings           → HIGH: relevant mitigation action
 */
export class RiskMitigationRecommendationGenerator implements RecommendationGenerator {
  private static readonly DEFINITION: RecommendationGeneratorDefinition = {
    id:          RecommendationGeneratorType.RISK_MITIGATION,
    name:        "Risk Mitigation Recommendation Generator",
    description: "Synthesises risk signals into emergency fund and risk-reduction recommendations.",
    version:     "1.0",
  };

  definition(): RecommendationGeneratorDefinition {
    return RiskMitigationRecommendationGenerator.DEFINITION;
  }

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation> {
    const recs: Recommendation[] = [];

    const criticalInsights = insightSnapshot.insights.filter(
      (i) => i.severity === InsightSeverityLevel.CRITICAL,
    );
    const riskInsights = insightSnapshot.insights.filter(
      (i) => i.type === InsightType.RISK,
    );
    const riskFindingIds = analyticsSnapshot.findings
      .filter((f) => f.type === AnalysisFindingType.RISK)
      .map((f) => f.id);

    // Multiple critical signals → emergency fund is the first line of resilience
    if (criticalInsights.length >= 2) {
      recs.push({
        id:       "RISK_MULTIPLE_CRITICAL_EMERGENCY_FUND",
        category: RecommendationCategory.EMERGENCY_FUND,
        priority: RecommendationPriority.CRITICAL,
        action:   RecommendationAction.BUILD_EMERGENCY_FUND,
        title:    "Multiple critical financial signals — build an emergency fund",
        rationale:
          `There are ${criticalInsights.length} critical financial signals active simultaneously. ` +
          "In this position, an unexpected expense or income disruption has no financial buffer to absorb it. " +
          "An emergency fund is the highest-impact protective action available.",
        impacts: [
          {
            dimension:      ImpactDimension.RISK,
            description:    "An emergency fund absorbs unexpected shocks without forcing debt or asset sales.",
            estimatedValue: null,
            impactScore:    95,
          },
          {
            dimension:      ImpactDimension.BEHAVIOURAL,
            description:    "A financial buffer reduces anxiety-driven financial decisions.",
            estimatedValue: null,
            impactScore:    70,
          },
        ],
        confidence:            RecommendationConfidence.HIGH,
        supportingInsightIds:  criticalInsights.map((i) => i.id),
        supportingFindingIds:  riskFindingIds,
        supportingMetricTypes: metricsSnapshot.evaluations
          .filter((e) => !e.isHealthy)
          .map((e) => e.result.type as string),
        generatedAt:           new Date(),
      });
    } else if (riskInsights.length > 0) {
      // Single risk signal — emergency fund still the right response
      recs.push({
        id:       "RISK_THRESHOLD_APPROACHING_EMERGENCY_FUND",
        category: RecommendationCategory.EMERGENCY_FUND,
        priority: RecommendationPriority.HIGH,
        action:   RecommendationAction.BUILD_EMERGENCY_FUND,
        title:    "Risk signals detected — strengthen financial resilience",
        rationale:
          "One or more metrics are approaching or breaching healthy thresholds. " +
          "A financial buffer protects against these risks compounding into a crisis " +
          "in the event of an unexpected expense or income gap.",
        impacts: [
          {
            dimension:      ImpactDimension.RISK,
            description:    "Liquid savings reduce the likelihood that a threshold breach becomes unrecoverable.",
            estimatedValue: null,
            impactScore:    80,
          },
        ],
        confidence:            RecommendationConfidence.MEDIUM,
        supportingInsightIds:  riskInsights.map((i) => i.id),
        supportingFindingIds:  riskFindingIds,
        supportingMetricTypes: [MetricType.DEBT_TO_INCOME_RATIO, MetricType.CREDIT_UTILIZATION],
        generatedAt:           new Date(),
      });
    }

    return recs;
  }
}
