import type { IInsightGenerator } from "../IInsightGenerator";
import type { FinancialInsightGeneratorDefinition } from "../FinancialInsightGeneratorDefinition";
import type { FinancialInsight } from "../FinancialInsight";
import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../../trends/TrendReport";
import { FinancialInsightGeneratorType } from "../FinancialInsightGeneratorType";
import { InsightMetricCategory } from "../InsightMetricCategory";
import { InsightType } from "../InsightType";
import { InsightSeverityLevel } from "../InsightSeverityLevel";
import { MetricType } from "../../metrics/MetricType";
import { TrendDirection } from "../../trends/TrendDirection";
import { findEvaluation, findTrend, computeConfidence, severityFromDistance, buildInsight, fmtValue } from "./InsightBuilder";

/** Credit utilisation > 80% is categorically critical. */
const CRITICAL_THRESHOLD = 0.80;
/** 50–79%: high risk. */
const HIGH_THRESHOLD = 0.50;

export class CreditInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.CREDIT,
    name:              "Credit Utilisation Insight Generator",
    description:       "Analyses credit utilisation against scoring and affordability benchmarks.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.CREDIT_UTILISATION],
    coveredMetrics:    [MetricType.CREDIT_UTILIZATION],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return CreditInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const evaluation = findEvaluation(snapshot, MetricType.CREDIT_UTILIZATION);
    if (!evaluation) return [];

    const trend      = findTrend(report, MetricType.CREDIT_UTILIZATION);
    const confidence = computeConfidence(trend);
    const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
    const pct        = fmtValue(evaluation.result.value, evaluation.result.unit);
    const value      = evaluation.result.value;

    if (evaluation.isHealthy) {
      if (direction === TrendDirection.IMPROVING) {
        return [buildInsight({
          metric:   MetricType.CREDIT_UTILIZATION,
          category: InsightMetricCategory.CREDIT_UTILISATION,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Credit Utilisation Falling",
          summary:  `Your credit utilisation of ${pct} is healthy and declining.`,
          details:  `Credit utilisation stands at ${pct}, within the recommended range, and has been falling over the analysis period — a positive signal for credit health.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      if (direction === TrendDirection.DECLINING) {
        return [buildInsight({
          metric:   MetricType.CREDIT_UTILIZATION,
          category: InsightMetricCategory.CREDIT_UTILISATION,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Credit Utilisation Rising",
          summary:  `Your credit utilisation of ${pct} is healthy but has been climbing.`,
          details:  `Although credit utilisation of ${pct} is still within the healthy range, the upward trend over the analysis period suggests available credit is being used at an increasing rate.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      return [buildInsight({
        metric:   MetricType.CREDIT_UTILIZATION,
        category: InsightMetricCategory.CREDIT_UTILISATION,
        type:     InsightType.NEUTRAL,
        severity: InsightSeverityLevel.LOW,
        title:    "Credit Utilisation Healthy",
        summary:  `Your credit utilisation of ${pct} is within the healthy range.`,
        details:  `Credit utilisation of ${pct} is within the recommended range and has remained consistent over the analysis period.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    // Unhealthy — apply domain-specific severity bands
    const severity = value >= CRITICAL_THRESHOLD
      ? InsightSeverityLevel.CRITICAL
      : value >= HIGH_THRESHOLD
        ? InsightSeverityLevel.HIGH
        : severityFromDistance(evaluation.distanceFromThreshold, evaluation.threshold);

    if (direction === TrendDirection.IMPROVING) {
      return [buildInsight({
        metric:   MetricType.CREDIT_UTILIZATION,
        category: InsightMetricCategory.CREDIT_UTILISATION,
        type:     InsightType.OPPORTUNITY,
        severity,
        title:    "Credit Utilisation High but Falling",
        summary:  `Your credit utilisation of ${pct} is above the recommended limit but declining.`,
        details:  `Credit utilisation of ${pct} exceeds the recommended ceiling, but has been declining over the analysis period, indicating progress toward the healthy range.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    return [buildInsight({
      metric:   MetricType.CREDIT_UTILIZATION,
      category: InsightMetricCategory.CREDIT_UTILISATION,
      type:     InsightType.RISK,
      severity,
      title:    value >= CRITICAL_THRESHOLD
        ? "Credit Utilisation Critically High"
        : "Credit Utilisation Above Recommended Limit",
      summary:  `Your credit utilisation of ${pct} exceeds the recommended maximum.`,
      details:  `High credit utilisation of ${pct} signals heavy reliance on available credit, which can affect borrowing capacity and credit profile. ${direction === TrendDirection.DECLINING ? "The upward trend indicates this is worsening." : ""}`.trim(),
      confidence,
      supportingTrends: trend ? [trend] : [],
    })];
  }
}
