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

/**
 * Produces goal-oriented observations using proxy metrics.
 *
 * Named GoalMetricInsightGenerator to distinguish from the legacy
 * GoalInsightGenerator that analyses AnalyticsSnapshot GOAL_PROGRESS findings.
 *
 * Proxies the GOALS category through MONTHS_TO_DEBT_FREEDOM (debt payoff goal)
 * and SAVINGS_RATE (wealth accumulation goal progress) until dedicated goal
 * metrics are introduced in a future milestone.
 */
export class GoalMetricInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.GOALS,
    name:              "Goal Metric Insight Generator",
    description:       "Provides goal-oriented observations via metric proxies.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.GOALS],
    coveredMetrics:    [MetricType.MONTHS_TO_DEBT_FREEDOM, MetricType.SAVINGS_RATE],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return GoalMetricInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const insights: FinancialInsight[] = [];

    // Debt payoff goal proxy
    const mdfEval = findEvaluation(snapshot, MetricType.MONTHS_TO_DEBT_FREEDOM);
    if (mdfEval) {
      const trend      = findTrend(report, MetricType.MONTHS_TO_DEBT_FREEDOM);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const months     = fmtValue(mdfEval.result.value, mdfEval.result.unit);

      if (direction === TrendDirection.IMPROVING) {
        insights.push(buildInsight({
          metric:   MetricType.MONTHS_TO_DEBT_FREEDOM,
          category: InsightMetricCategory.GOALS,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Debt Payoff Goal on Track",
          summary:  `Debt freedom in ${months} — the timeline is shortening.`,
          details:  `Based on current repayment pace, debt freedom is estimated in ${months}. The debt payoff goal is on track with the timeline shortening over the analysis period.`,
          confidence,
          supportingMetrics: [MetricType.MONTHS_TO_DEBT_FREEDOM],
          supportingTrends:  trend ? [trend] : [],
        }));
      } else if (direction === TrendDirection.DECLINING) {
        insights.push(buildInsight({
          metric:   MetricType.MONTHS_TO_DEBT_FREEDOM,
          category: InsightMetricCategory.GOALS,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Debt Payoff Goal Slipping",
          summary:  `Debt freedom in ${months} — the timeline is lengthening.`,
          details:  `The estimated time to debt freedom has extended to ${months}. The debt payoff goal appears to be slipping, with the timeline growing over the analysis period.`,
          confidence,
          supportingMetrics: [MetricType.MONTHS_TO_DEBT_FREEDOM],
          supportingTrends:  trend ? [trend] : [],
        }));
      }
    }

    // Wealth accumulation goal proxy
    const savEval = findEvaluation(snapshot, MetricType.SAVINGS_RATE);
    if (savEval && savEval.isHealthy) {
      const trend      = findTrend(report, MetricType.SAVINGS_RATE);
      const confidence = computeConfidence(trend);
      const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
      const pct        = fmtValue(savEval.result.value, savEval.result.unit);

      if (direction === TrendDirection.IMPROVING) {
        insights.push(buildInsight({
          metric:   MetricType.SAVINGS_RATE,
          category: InsightMetricCategory.GOALS,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Wealth Accumulation Accelerating",
          summary:  `A savings rate of ${pct} and rising supports long-term wealth goals.`,
          details:  `Your savings rate of ${pct} — above the minimum and growing — indicates that wealth accumulation is progressing at an accelerating rate.`,
          confidence,
          supportingMetrics: [MetricType.SAVINGS_RATE],
          supportingTrends:  trend ? [trend] : [],
        }));
      }
    }

    return insights;
  }
}
