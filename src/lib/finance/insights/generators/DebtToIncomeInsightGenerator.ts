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

/** DTI > 50% is categorically critical regardless of normalised distance. */
const CRITICAL_DTI = 0.50;

export class DebtToIncomeInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.DEBT_TO_INCOME,
    name:              "Debt-to-Income Insight Generator",
    description:       "Analyses the debt-to-income ratio against lender and affordability benchmarks.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.DEBT_TO_INCOME],
    coveredMetrics:    [MetricType.DEBT_TO_INCOME_RATIO],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return DebtToIncomeInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const evaluation = findEvaluation(snapshot, MetricType.DEBT_TO_INCOME_RATIO);
    if (!evaluation) return [];

    const trend      = findTrend(report, MetricType.DEBT_TO_INCOME_RATIO);
    const confidence = computeConfidence(trend);
    const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
    const pct        = fmtValue(evaluation.result.value, evaluation.result.unit);
    const value      = evaluation.result.value;

    if (evaluation.isHealthy) {
      if (direction === TrendDirection.IMPROVING) {
        return [buildInsight({
          metric:   MetricType.DEBT_TO_INCOME_RATIO,
          category: InsightMetricCategory.DEBT_TO_INCOME,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Debt-to-Income Ratio Improving",
          summary:  `Your DTI of ${pct} is healthy and falling.`,
          details:  `Your debt-to-income ratio stands at ${pct} within the healthy range, and has been declining over the analysis period, reflecting a growing capacity to manage debt obligations relative to income.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      if (direction === TrendDirection.DECLINING) {
        return [buildInsight({
          metric:   MetricType.DEBT_TO_INCOME_RATIO,
          category: InsightMetricCategory.DEBT_TO_INCOME,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Debt-to-Income Ratio Creeping Up",
          summary:  `Your DTI of ${pct} is healthy but has been rising.`,
          details:  `Your debt-to-income ratio of ${pct} is still within the healthy range, but the upward trend over the analysis period signals that debt obligations are growing relative to income.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      return [buildInsight({
        metric:   MetricType.DEBT_TO_INCOME_RATIO,
        category: InsightMetricCategory.DEBT_TO_INCOME,
        type:     InsightType.NEUTRAL,
        severity: InsightSeverityLevel.LOW,
        title:    "Debt-to-Income Ratio Healthy",
        summary:  `Your DTI of ${pct} is within the healthy range.`,
        details:  `Your debt-to-income ratio of ${pct} is within the healthy range and has remained consistent over the analysis period.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    // Unhealthy
    const severity = value >= CRITICAL_DTI
      ? InsightSeverityLevel.CRITICAL
      : severityFromDistance(evaluation.distanceFromThreshold, evaluation.threshold);

    if (direction === TrendDirection.IMPROVING) {
      return [buildInsight({
        metric:   MetricType.DEBT_TO_INCOME_RATIO,
        category: InsightMetricCategory.DEBT_TO_INCOME,
        type:     InsightType.OPPORTUNITY,
        severity,
        title:    "Debt-to-Income Ratio High but Declining",
        summary:  `Your DTI of ${pct} exceeds the healthy threshold but has been falling.`,
        details:  `Your debt-to-income ratio of ${pct} is above the recommended maximum, but has been declining over the analysis period, suggesting the debt burden relative to income is reducing.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    return [buildInsight({
      metric:   MetricType.DEBT_TO_INCOME_RATIO,
      category: InsightMetricCategory.DEBT_TO_INCOME,
      type:     InsightType.RISK,
      severity,
      title:    value >= CRITICAL_DTI ? "Debt-to-Income Ratio Critically High" : "Debt-to-Income Ratio Above Healthy Range",
      summary:  `Your DTI of ${pct} exceeds recommended limits.`,
      details:  `A debt-to-income ratio of ${pct} indicates that a high proportion of income is committed to debt repayment. ${direction === TrendDirection.DECLINING ? "The upward trend indicates this burden is increasing." : ""}`.trim(),
      confidence,
      supportingTrends: trend ? [trend] : [],
    })];
  }
}
