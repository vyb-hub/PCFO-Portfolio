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

/**
 * Analyses metric-based spending indicators (RECURRING_EXPENSES_RATIO and BURN_RATE).
 *
 * Named SpendingMetricInsightGenerator to distinguish from the legacy
 * SpendingInsightGenerator that analyses AnalyticsSnapshot seasonality findings.
 */
export class SpendingMetricInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.SPENDING,
    name:              "Spending Metric Insight Generator",
    description:       "Analyses recurring expenses ratio and burn rate from metric data.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.SPENDING],
    coveredMetrics:    [MetricType.RECURRING_SPEND, MetricType.RECURRING_EXPENSES_RATIO, MetricType.BURN_RATE],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return SpendingMetricInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const insights: FinancialInsight[] = [];

    // Recurring Expenses Ratio
    const rerEval = findEvaluation(snapshot, MetricType.RECURRING_EXPENSES_RATIO);
    if (rerEval) {
      const trend      = findTrend(report, MetricType.RECURRING_EXPENSES_RATIO);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const pct        = fmtValue(rerEval.result.value, rerEval.result.unit);

      if (rerEval.isHealthy) {
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   MetricType.RECURRING_EXPENSES_RATIO,
            category: InsightMetricCategory.SPENDING,
            type:     InsightType.POSITIVE,
            severity: InsightSeverityLevel.LOW,
            title:    "Recurring Expenses Ratio Falling",
            summary:  `Fixed costs represent ${pct} of income — down from prior periods.`,
            details:  `Your recurring expenses account for ${pct} of income, within the healthy range, and this ratio has been declining. A lower ratio leaves more income available for savings and discretionary spending.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else if (direction === TrendDirection.DECLINING) {
          insights.push(buildInsight({
            metric:   MetricType.RECURRING_EXPENSES_RATIO,
            category: InsightMetricCategory.SPENDING,
            type:     InsightType.WARNING,
            severity: InsightSeverityLevel.MEDIUM,
            title:    "Recurring Expenses Ratio Creeping Up",
            summary:  `Fixed costs represent ${pct} of income — an increasing share.`,
            details:  `Your recurring expenses account for ${pct} of income, still within the healthy range, but this ratio has been rising over the analysis period, leaving less room for savings.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   MetricType.RECURRING_EXPENSES_RATIO,
            category: InsightMetricCategory.SPENDING,
            type:     InsightType.NEUTRAL,
            severity: InsightSeverityLevel.LOW,
            title:    "Recurring Expenses Ratio Stable",
            summary:  `Fixed costs represent a stable ${pct} of income.`,
            details:  `Your recurring expenses account for ${pct} of income and have remained consistent over the analysis period.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      } else {
        const severity = severityFromDistance(rerEval.distanceFromThreshold, rerEval.threshold);
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   MetricType.RECURRING_EXPENSES_RATIO,
            category: InsightMetricCategory.SPENDING,
            type:     InsightType.OPPORTUNITY,
            severity: InsightSeverityLevel.HIGH,
            title:    "Recurring Expenses Ratio High but Falling",
            summary:  `Fixed costs are ${pct} of income — above the limit but declining.`,
            details:  `Your recurring expenses represent ${pct} of income, above the recommended ceiling, but the ratio has been falling over the analysis period.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   MetricType.RECURRING_EXPENSES_RATIO,
            category: InsightMetricCategory.SPENDING,
            type:     InsightType.RISK,
            severity,
            title:    "Recurring Expenses Too High Relative to Income",
            summary:  `Fixed costs represent ${pct} of income — above the recommended maximum.`,
            details:  `With recurring expenses at ${pct} of income, a disproportionate share of income is committed to fixed costs. ${direction === TrendDirection.DECLINING ? "The upward trend indicates the burden is growing." : ""}`.trim(),
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      }
    }

    // Burn Rate (trend-only signal — no universal healthy threshold)
    const burnEval = findEvaluation(snapshot, MetricType.BURN_RATE);
    if (burnEval) {
      const trend      = findTrend(report, MetricType.BURN_RATE);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const formatted  = fmtValue(burnEval.result.value, burnEval.result.unit);

      if (direction === TrendDirection.IMPROVING) {
        insights.push(buildInsight({
          metric:   MetricType.BURN_RATE,
          category: InsightMetricCategory.SPENDING,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Burn Rate Decreasing",
          summary:  `Your monthly burn rate of ${formatted} has been declining.`,
          details:  `Your burn rate stands at ${formatted} and has been falling over the analysis period, indicating reduced spending relative to prior periods.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        }));
      } else if (direction === TrendDirection.DECLINING) {
        insights.push(buildInsight({
          metric:   MetricType.BURN_RATE,
          category: InsightMetricCategory.SPENDING,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Burn Rate Increasing",
          summary:  `Your monthly burn rate of ${formatted} has been rising.`,
          details:  `Your burn rate stands at ${formatted} and has been increasing over the analysis period, indicating an upward trend in total monthly spending.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        }));
      }
    }

    return insights;
  }
}
