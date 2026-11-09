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

export class SavingsInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.SAVINGS,
    name:              "Savings Insight Generator",
    description:       "Analyses savings rate health and trend.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.SAVINGS],
    coveredMetrics:    [MetricType.SAVINGS_RATE],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return SavingsInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const evaluation = findEvaluation(snapshot, MetricType.SAVINGS_RATE);
    if (!evaluation) return [];

    const trend      = findTrend(report, MetricType.SAVINGS_RATE);
    const confidence = computeConfidence(trend);
    const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
    const pct        = fmtValue(evaluation.result.value, evaluation.result.unit);

    if (evaluation.isHealthy) {
      if (direction === TrendDirection.IMPROVING) {
        return [buildInsight({
          metric:   MetricType.SAVINGS_RATE,
          category: InsightMetricCategory.SAVINGS,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Savings Rate on the Rise",
          summary:  `Your savings rate of ${pct} is in the healthy range and has been growing.`,
          details:  `Your savings rate has been rising steadily over the analysis period, reaching ${pct}. This reflects a consistent pattern of allocating a growing share of income to savings.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      if (direction === TrendDirection.STABLE) {
        return [buildInsight({
          metric:   MetricType.SAVINGS_RATE,
          category: InsightMetricCategory.SAVINGS,
          type:     InsightType.NEUTRAL,
          severity: InsightSeverityLevel.LOW,
          title:    "Savings Rate Holding Steady",
          summary:  `Your savings rate of ${pct} is stable and within the healthy range.`,
          details:  `Your savings rate has remained consistent at ${pct} over the analysis window, staying within the healthy range with minimal variation.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      if (direction === TrendDirection.DECLINING) {
        return [buildInsight({
          metric:   MetricType.SAVINGS_RATE,
          category: InsightMetricCategory.SAVINGS,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Savings Rate Declining",
          summary:  `Your savings rate of ${pct} is still healthy but has been falling.`,
          details:  `Although currently within the healthy range at ${pct}, your savings rate has been declining over the analysis period. The margin above the minimum threshold is narrowing.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      if (direction === TrendDirection.VOLATILE) {
        return [buildInsight({
          metric:   MetricType.SAVINGS_RATE,
          category: InsightMetricCategory.SAVINGS,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.LOW,
          title:    "Savings Rate Irregular",
          summary:  `Your savings rate of ${pct} is healthy but shows high month-to-month variation.`,
          details:  `Your savings rate averages ${pct} in the healthy range, but fluctuates significantly between periods, making the trend difficult to assess with confidence.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      // INSUFFICIENT_DATA
      return [buildInsight({
        metric:   MetricType.SAVINGS_RATE,
        category: InsightMetricCategory.SAVINGS,
        type:     InsightType.NEUTRAL,
        severity: InsightSeverityLevel.LOW,
        title:    "Savings Rate Healthy",
        summary:  `Your savings rate of ${pct} is within the healthy range.`,
        details:  `Your savings rate of ${pct} is within the healthy range. More data periods are needed to assess the direction of change.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    // Unhealthy — normalise against 0.5 (half-income range), not threshold.min (0.10).
    // Without rangeRef, a -0.8% savings rate would normalise to 1.08× → CRITICAL, which
    // misrepresents a ₹1–2k monthly overspend on ₹2L income as a financial emergency.
    // With rangeRef=0.5: -0.8% → MEDIUM, -15% → HIGH, -25%+ → CRITICAL.
    const severity = severityFromDistance(evaluation.distanceFromThreshold, evaluation.threshold, 0.5);
    if (direction === TrendDirection.IMPROVING) {
      return [buildInsight({
        metric:   MetricType.SAVINGS_RATE,
        category: InsightMetricCategory.SAVINGS,
        type:     InsightType.OPPORTUNITY,
        severity: InsightSeverityLevel.MEDIUM,
        title:    "Savings Rate Improving Toward Target",
        summary:  `Your savings rate of ${pct} is below the minimum but has been rising.`,
        details:  `Although your savings rate of ${pct} is currently below the minimum threshold, it has been trending upward over the analysis period, indicating a positive trajectory toward the healthy range.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }
    return [buildInsight({
      metric:   MetricType.SAVINGS_RATE,
      category: InsightMetricCategory.SAVINGS,
      type:     InsightType.RISK,
      severity,
      title:    "Savings Rate Below Minimum",
      summary:  `Your savings rate of ${pct} is below the recommended minimum.`,
      details:  `At ${pct}, your savings rate falls short of the minimum threshold for long-term financial security. ${direction === TrendDirection.DECLINING ? "The downward trend indicates the gap is widening." : ""}`.trim(),
      confidence,
      supportingTrends: trend ? [trend] : [],
    })];
  }
}
