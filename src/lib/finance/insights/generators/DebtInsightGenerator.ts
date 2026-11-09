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

export class DebtInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.DEBT,
    name:              "Debt Insight Generator",
    description:       "Analyses total debt ratio and progress to debt freedom.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.DEBT],
    coveredMetrics:    [MetricType.DEBT_RATIO, MetricType.MONTHS_TO_DEBT_FREEDOM],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return DebtInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const insights: FinancialInsight[] = [];

    // Debt Ratio
    const debtEval = findEvaluation(snapshot, MetricType.DEBT_RATIO);
    if (debtEval) {
      const trend      = findTrend(report, MetricType.DEBT_RATIO);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const pct        = fmtValue(debtEval.result.value, debtEval.result.unit);

      if (debtEval.isHealthy) {
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   MetricType.DEBT_RATIO,
            category: InsightMetricCategory.DEBT,
            type:     InsightType.POSITIVE,
            severity: InsightSeverityLevel.LOW,
            title:    "Debt Ratio Improving",
            summary:  `Your debt ratio of ${pct} is healthy and declining.`,
            details:  `Your debt ratio stands at ${pct} and has been decreasing over the analysis period, indicating debt is being reduced relative to income.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else if (direction === TrendDirection.DECLINING) {
          insights.push(buildInsight({
            metric:   MetricType.DEBT_RATIO,
            category: InsightMetricCategory.DEBT,
            type:     InsightType.WARNING,
            severity: InsightSeverityLevel.MEDIUM,
            title:    "Debt Ratio Rising",
            summary:  `Your debt ratio of ${pct} is still healthy but has been increasing.`,
            details:  `Your debt ratio of ${pct} remains within the healthy range, but an upward trend over the analysis period indicates debt is growing relative to income.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   MetricType.DEBT_RATIO,
            category: InsightMetricCategory.DEBT,
            type:     InsightType.NEUTRAL,
            severity: InsightSeverityLevel.LOW,
            title:    "Debt Ratio Within Healthy Range",
            summary:  `Your debt ratio of ${pct} is within the healthy range.`,
            details:  `Your debt ratio of ${pct} is within the healthy range and has remained consistent over the analysis period.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      } else {
        const severity = severityFromDistance(debtEval.distanceFromThreshold, debtEval.threshold);
        if (direction === TrendDirection.IMPROVING) {
          insights.push(buildInsight({
            metric:   MetricType.DEBT_RATIO,
            category: InsightMetricCategory.DEBT,
            type:     InsightType.OPPORTUNITY,
            severity: InsightSeverityLevel.HIGH,
            title:    "Debt Ratio High but Declining",
            summary:  `Your debt ratio of ${pct} is above the healthy maximum but has been falling.`,
            details:  `Your debt ratio of ${pct} exceeds the recommended ceiling, but the downward trend over the analysis period indicates progress is being made in reducing it.`,
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        } else {
          insights.push(buildInsight({
            metric:   MetricType.DEBT_RATIO,
            category: InsightMetricCategory.DEBT,
            type:     InsightType.RISK,
            severity,
            title:    "Debt Ratio Above Healthy Range",
            summary:  `Your debt ratio of ${pct} exceeds the recommended maximum.`,
            details:  `At ${pct}, your debt ratio is outside the healthy range. ${direction === TrendDirection.DECLINING ? "The rising trend indicates the situation is worsening." : ""}`.trim(),
            confidence,
            supportingTrends: trend ? [trend] : [],
          }));
        }
      }
    }

    // Months to Debt Freedom
    const mdfEval = findEvaluation(snapshot, MetricType.MONTHS_TO_DEBT_FREEDOM);
    if (mdfEval) {
      const trend      = findTrend(report, MetricType.MONTHS_TO_DEBT_FREEDOM);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const months     = fmtValue(mdfEval.result.value, mdfEval.result.unit);

      if (direction === TrendDirection.IMPROVING) {
        insights.push(buildInsight({
          metric:   MetricType.MONTHS_TO_DEBT_FREEDOM,
          category: InsightMetricCategory.DEBT,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Debt Freedom Timeline Shortening",
          summary:  `At the current pace, debt freedom is ${months} away — and that timeline is shrinking.`,
          details:  `The estimated time to debt freedom stands at ${months} and has been decreasing over the analysis period, indicating accelerating debt repayment.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        }));
      } else if (direction === TrendDirection.DECLINING) {
        insights.push(buildInsight({
          metric:   MetricType.MONTHS_TO_DEBT_FREEDOM,
          category: InsightMetricCategory.DEBT,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Debt Freedom Timeline Extending",
          summary:  `Debt freedom is estimated at ${months} away — this timeline has been lengthening.`,
          details:  `The estimated time to debt freedom has increased over the analysis period to ${months}, suggesting that debt repayment progress has slowed or new debt has been added.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        }));
      } else if (direction !== TrendDirection.INSUFFICIENT_DATA) {
        insights.push(buildInsight({
          metric:   MetricType.MONTHS_TO_DEBT_FREEDOM,
          category: InsightMetricCategory.DEBT,
          type:     InsightType.NEUTRAL,
          severity: InsightSeverityLevel.LOW,
          title:    "Debt Freedom Timeline Steady",
          summary:  `At the current rate, debt freedom is ${months} away.`,
          details:  `The estimated time to debt freedom stands at ${months} and has remained broadly stable over the analysis period.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        }));
      }
    }

    return insights;
  }
}
