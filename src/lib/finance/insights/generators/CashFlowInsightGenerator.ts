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

export class CashFlowInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.CASH_FLOW,
    name:              "Cash Flow Insight Generator",
    description:       "Analyses cash flow and net cash flow health and trend.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.CASH_FLOW],
    coveredMetrics:    [MetricType.CASH_FLOW, MetricType.NET_CASH_FLOW],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return CashFlowInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const insights: FinancialInsight[] = [];

    for (const metricType of [MetricType.CASH_FLOW, MetricType.NET_CASH_FLOW] as const) {
      const evaluation = findEvaluation(snapshot, metricType);
      if (!evaluation) continue;

      const trend      = findTrend(report, metricType);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const formatted  = fmtValue(evaluation.result.value, evaluation.result.unit);

      if (evaluation.isHealthy) {
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   metricType,
            category: InsightMetricCategory.CASH_FLOW,
            type:     InsightType.POSITIVE,
            severity: InsightSeverityLevel.LOW,
            title:    "Cash Flow Strengthening",
            summary:  `Cash flow of ${formatted} is positive and improving.`,
            details:  `Cash flow stands at ${formatted} and has been increasing over the analysis period, indicating that income is consistently exceeding expenses by a growing margin.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else if (direction === TrendDirection.DECLINING) {
          insights.push(buildInsight({
            metric:   metricType,
            category: InsightMetricCategory.CASH_FLOW,
            type:     InsightType.WARNING,
            severity: InsightSeverityLevel.MEDIUM,
            title:    "Cash Flow Narrowing",
            summary:  `Cash flow of ${formatted} is positive but has been declining.`,
            details:  `While cash flow remains positive at ${formatted}, it has been declining over the analysis period. The buffer between income and expenses is shrinking.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else if (direction === TrendDirection.VOLATILE) {
          insights.push(buildInsight({
            metric:   metricType,
            category: InsightMetricCategory.CASH_FLOW,
            type:     InsightType.WARNING,
            severity: InsightSeverityLevel.LOW,
            title:    "Cash Flow Irregular",
            summary:  `Cash flow of ${formatted} is positive but highly variable.`,
            details:  `Cash flow averages ${formatted} in the positive range but shows significant period-to-period variation, making the picture difficult to assess reliably.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   metricType,
            category: InsightMetricCategory.CASH_FLOW,
            type:     InsightType.NEUTRAL,
            severity: InsightSeverityLevel.LOW,
            title:    "Cash Flow Stable",
            summary:  `Cash flow of ${formatted} is positive and steady.`,
            details:  `Cash flow stands at ${formatted} and has remained broadly consistent over the analysis period, reflecting a stable surplus of income over expenses.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      } else {
        const severity = severityFromDistance(evaluation.distanceFromThreshold, evaluation.threshold);
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   metricType,
            category: InsightMetricCategory.CASH_FLOW,
            type:     InsightType.OPPORTUNITY,
            severity: InsightSeverityLevel.HIGH,
            title:    "Cash Flow Negative but Recovering",
            summary:  `Cash flow of ${formatted} is negative but trending toward balance.`,
            details:  `Cash flow stands at ${formatted} — expenses are exceeding income. However, the trend shows improvement over the analysis period, indicating the deficit is narrowing.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   metricType,
            category: InsightMetricCategory.CASH_FLOW,
            type:     InsightType.RISK,
            severity,
            title:    "Negative Cash Flow",
            summary:  `Cash flow of ${formatted} is negative — expenses exceed income.`,
            details:  `Cash flow stands at ${formatted}, meaning more money is leaving than coming in. ${direction === TrendDirection.DECLINING ? "The deficit has been widening over the analysis period." : ""}`.trim(),
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      }
    }

    return insights;
  }
}
