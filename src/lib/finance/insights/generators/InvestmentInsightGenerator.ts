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

export class InvestmentInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.INVESTMENTS,
    name:              "Investment Insight Generator",
    description:       "Analyses investment allocation ratio and liquidity ratio.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.INVESTMENTS],
    coveredMetrics:    [MetricType.INVESTMENT_RATIO, MetricType.LIQUIDITY_RATIO],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return InvestmentInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const insights: FinancialInsight[] = [];

    // Investment Ratio
    const invEval = findEvaluation(snapshot, MetricType.INVESTMENT_RATIO);
    if (invEval) {
      const trend      = findTrend(report, MetricType.INVESTMENT_RATIO);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const pct        = fmtValue(invEval.result.value, invEval.result.unit);

      if (invEval.isHealthy) {
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   MetricType.INVESTMENT_RATIO,
            category: InsightMetricCategory.INVESTMENTS,
            type:     InsightType.POSITIVE,
            severity: InsightSeverityLevel.LOW,
            title:    "Investment Allocation Growing",
            summary:  `You are investing ${pct} of income — healthy and rising.`,
            details:  `Your investment ratio stands at ${pct}, within the healthy range, and has been growing over the analysis period, reflecting an increasing commitment to long-term wealth building.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else if (direction === TrendDirection.DECLINING) {
          insights.push(buildInsight({
            metric:   MetricType.INVESTMENT_RATIO,
            category: InsightMetricCategory.INVESTMENTS,
            type:     InsightType.WARNING,
            severity: InsightSeverityLevel.MEDIUM,
            title:    "Investment Allocation Declining",
            summary:  `Investment ratio of ${pct} is healthy but falling.`,
            details:  `Your investment ratio of ${pct} is within the healthy range, but has been declining over the analysis period, suggesting a smaller share of income is being directed toward long-term wealth.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   MetricType.INVESTMENT_RATIO,
            category: InsightMetricCategory.INVESTMENTS,
            type:     InsightType.NEUTRAL,
            severity: InsightSeverityLevel.LOW,
            title:    "Investment Allocation Steady",
            summary:  `You are consistently investing ${pct} of income.`,
            details:  `Your investment ratio stands at ${pct} and has remained stable within the healthy range over the analysis period.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      } else {
        const severity = severityFromDistance(invEval.distanceFromThreshold, invEval.threshold);
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   MetricType.INVESTMENT_RATIO,
            category: InsightMetricCategory.INVESTMENTS,
            type:     InsightType.OPPORTUNITY,
            severity: InsightSeverityLevel.MEDIUM,
            title:    "Investment Allocation Growing Toward Target",
            summary:  `Investment ratio of ${pct} is below the minimum but rising.`,
            details:  `Your investment ratio of ${pct} is below the recommended minimum, but the upward trend indicates growing allocation toward long-term wealth building.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   MetricType.INVESTMENT_RATIO,
            category: InsightMetricCategory.INVESTMENTS,
            type:     InsightType.RISK,
            severity,
            title:    "Investment Allocation Below Minimum",
            summary:  `Investment ratio of ${pct} is below the recommended minimum.`,
            details:  `At ${pct}, less than the recommended minimum share of income is being directed toward investments. This limits long-term wealth accumulation. ${direction === TrendDirection.DECLINING ? "The downward trend indicates allocation is falling further." : ""}`.trim(),
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      }
    }

    // Liquidity Ratio
    const liqEval = findEvaluation(snapshot, MetricType.LIQUIDITY_RATIO);
    if (liqEval) {
      const trend      = findTrend(report, MetricType.LIQUIDITY_RATIO);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const formatted  = fmtValue(liqEval.result.value, liqEval.result.unit);

      if (liqEval.isHealthy) {
        if (direction === TrendDirection.DECLINING) {
          insights.push(buildInsight({
            metric:   MetricType.LIQUIDITY_RATIO,
            category: InsightMetricCategory.INVESTMENTS,
            type:     InsightType.WARNING,
            severity: InsightSeverityLevel.MEDIUM,
            title:    "Liquidity Ratio Declining",
            summary:  `Liquidity ratio of ${formatted} is healthy but trending down.`,
            details:  `Your liquidity ratio stands at ${formatted}, within the healthy range, but has been declining over the analysis period. A lower liquidity ratio indicates current liabilities are growing relative to liquid assets.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      } else {
        const severity = severityFromDistance(liqEval.distanceFromThreshold, liqEval.threshold);
        insights.push(buildInsight({
          metric:   MetricType.LIQUIDITY_RATIO,
          category: InsightMetricCategory.INVESTMENTS,
          type:     direction === TrendDirection.IMPROVING ? InsightType.OPPORTUNITY : InsightType.RISK,
          severity,
          title:    direction === TrendDirection.IMPROVING ? "Liquidity Ratio Improving" : "Liquidity Ratio Below Minimum",
          summary:  `Liquidity ratio of ${formatted} indicates current liabilities exceed liquid assets.`,
          details:  `A liquidity ratio of ${formatted} means liquid assets may be insufficient to cover current liabilities. ${direction === TrendDirection.IMPROVING ? "However, the ratio has been improving." : ""}`.trim(),
          confidence,
          supportingTrends: trend ? [trend] : [],
        }));
      }
    }

    return insights;
  }
}
