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
import { findEvaluation, findTrend, computeConfidence, buildInsight, fmtValue } from "./InsightBuilder";

export class NetWorthInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.NET_WORTH,
    name:              "Net Worth Insight Generator",
    description:       "Analyses net worth direction and significant threshold crossings.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.NET_WORTH],
    coveredMetrics:    [MetricType.NET_WORTH],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return NetWorthInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const evaluation = findEvaluation(snapshot, MetricType.NET_WORTH);
    if (!evaluation) return [];

    const trend      = findTrend(report, MetricType.NET_WORTH);
    const confidence = computeConfidence(trend);
    const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
    const value      = evaluation.result.value;
    const formatted  = fmtValue(value, evaluation.result.unit);

    // Milestone: first positive net worth (crossed zero from below)
    if (value > 0 && direction === TrendDirection.IMPROVING && trend && trend.stats.absoluteChange > 0) {
      const prevEstimate = value - trend.stats.absoluteChange;
      if (prevEstimate <= 0) {
        return [buildInsight({
          metric:   MetricType.NET_WORTH,
          category: InsightMetricCategory.NET_WORTH,
          type:     InsightType.MILESTONE,
          severity: InsightSeverityLevel.LOW,
          title:    "Net Worth Turned Positive",
          summary:  `Your net worth of ${formatted} has crossed into positive territory.`,
          details:  `Your net worth of ${formatted} represents a significant milestone — total assets now exceed total liabilities. This marks the transition from net debt to positive net wealth.`,
          confidence,
          supportingTrends: [trend],
        })];
      }
    }

    if (direction === TrendDirection.IMPROVING) {
      return [buildInsight({
        metric:   MetricType.NET_WORTH,
        category: InsightMetricCategory.NET_WORTH,
        type:     InsightType.POSITIVE,
        severity: InsightSeverityLevel.LOW,
        title:    "Net Worth Growing",
        summary:  `Your net worth of ${formatted} has been growing.`,
        details:  `Net worth stands at ${formatted} and has increased over the analysis period, indicating that assets are growing faster than liabilities.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    if (direction === TrendDirection.DECLINING) {
      const severity = value < 0
        ? InsightSeverityLevel.HIGH
        : InsightSeverityLevel.MEDIUM;
      return [buildInsight({
        metric:   MetricType.NET_WORTH,
        category: InsightMetricCategory.NET_WORTH,
        type:     value < 0 ? InsightType.RISK : InsightType.WARNING,
        severity,
        title:    value < 0 ? "Negative Net Worth Worsening" : "Net Worth Declining",
        summary:  `Your net worth of ${formatted} has been falling.`,
        details:  `Net worth stands at ${formatted} and has been declining over the analysis period. ${value < 0 ? "Total liabilities currently exceed total assets." : "Assets are growing more slowly than liabilities, reducing overall wealth."}`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    if (direction === TrendDirection.STABLE || direction === TrendDirection.VOLATILE) {
      return [buildInsight({
        metric:   MetricType.NET_WORTH,
        category: InsightMetricCategory.NET_WORTH,
        type:     InsightType.NEUTRAL,
        severity: InsightSeverityLevel.LOW,
        title:    direction === TrendDirection.VOLATILE ? "Net Worth Fluctuating" : "Net Worth Stable",
        summary:  `Your net worth of ${formatted} is broadly unchanged.`,
        details:  `Net worth stands at ${formatted}. ${direction === TrendDirection.VOLATILE ? "It has been fluctuating over the analysis period without a clear directional trend." : "It has remained stable over the analysis period."}`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    // INSUFFICIENT_DATA
    return [buildInsight({
      metric:   MetricType.NET_WORTH,
      category: InsightMetricCategory.NET_WORTH,
      type:     InsightType.NEUTRAL,
      severity: InsightSeverityLevel.LOW,
      title:    "Net Worth Recorded",
      summary:  `Your current net worth is ${formatted}.`,
      details:  `Net worth stands at ${formatted}. More data periods are needed to assess the direction of change.`,
      confidence,
      supportingTrends: [],
    })];
  }
}
