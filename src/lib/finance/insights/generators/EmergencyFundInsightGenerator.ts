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

/** Below this value the emergency fund is critically insufficient. */
const CRITICAL_MONTHS = 0.5;
/** Below this the fund is dangerously thin (but not yet critical). */
const VERY_LOW_MONTHS = 1.0;
/** Below the standard minimum of 3 months. */
const MIN_MONTHS = 3.0;
/** Fully-funded milestone. */
const IDEAL_MONTHS = 6.0;

export class EmergencyFundInsightGenerator implements IInsightGenerator {
  private static readonly DEF: FinancialInsightGeneratorDefinition = {
    id:                FinancialInsightGeneratorType.EMERGENCY_FUND,
    name:              "Emergency Fund Insight Generator",
    description:       "Analyses emergency fund coverage in months of expenses.",
    version:           "1.0.0",
    coveredCategories: [InsightMetricCategory.EMERGENCY_FUND],
    coveredMetrics:    [MetricType.EMERGENCY_FUND_COVERAGE],
  };

  definition(): FinancialInsightGeneratorDefinition {
    return EmergencyFundInsightGenerator.DEF;
  }

  generate(snapshot: FinancialMetricsSnapshot, report: TrendReport): ReadonlyArray<FinancialInsight> {
    const evaluation = findEvaluation(snapshot, MetricType.EMERGENCY_FUND_COVERAGE);
    if (!evaluation) return [];

    const trend      = findTrend(report, MetricType.EMERGENCY_FUND_COVERAGE);
    const confidence = computeConfidence(trend);
    const direction  = trend?.direction ?? TrendDirection.INSUFFICIENT_DATA;
    const value      = evaluation.result.value;
    const months     = fmtValue(value, evaluation.result.unit);

    // ─── Milestone: fully funded at or above 6 months ───────────────────────
    if (value >= IDEAL_MONTHS && evaluation.isHealthy) {
      return [buildInsight({
        metric:   MetricType.EMERGENCY_FUND_COVERAGE,
        category: InsightMetricCategory.EMERGENCY_FUND,
        type:     InsightType.MILESTONE,
        severity: InsightSeverityLevel.LOW,
        title:    "Emergency Fund Fully Funded",
        summary:  `Your emergency fund covers ${months} of expenses — meeting the 6-month ideal.`,
        details:  `With ${months} of expense coverage, your emergency fund has reached the fully-funded milestone of six months. This provides a robust buffer against income disruption or unexpected expenses.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    // ─── Healthy (3–5.9 months) ───────────────────────────────────────────────
    if (evaluation.isHealthy) {
      if (direction === TrendDirection.IMPROVING) {
        return [buildInsight({
          metric:   MetricType.EMERGENCY_FUND_COVERAGE,
          category: InsightMetricCategory.EMERGENCY_FUND,
          type:     InsightType.POSITIVE,
          severity: InsightSeverityLevel.LOW,
          title:    "Emergency Fund Growing",
          summary:  `Emergency fund covers ${months} of expenses and is growing.`,
          details:  `Your emergency fund covers ${months} of expenses, within the healthy range of 3–6 months, and has been growing over the analysis period.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      if (direction === TrendDirection.DECLINING) {
        return [buildInsight({
          metric:   MetricType.EMERGENCY_FUND_COVERAGE,
          category: InsightMetricCategory.EMERGENCY_FUND,
          type:     InsightType.WARNING,
          severity: InsightSeverityLevel.MEDIUM,
          title:    "Emergency Fund Being Drawn Down",
          summary:  `Emergency fund covers ${months} of expenses but has been declining.`,
          details:  `Your emergency fund covers ${months} of expenses, within the 3-month minimum, but the coverage has been declining over the analysis period, reducing the safety buffer.`,
          confidence,
          supportingTrends: trend ? [trend] : [],
        })];
      }
      return [buildInsight({
        metric:   MetricType.EMERGENCY_FUND_COVERAGE,
        category: InsightMetricCategory.EMERGENCY_FUND,
        type:     InsightType.NEUTRAL,
        severity: InsightSeverityLevel.LOW,
        title:    "Emergency Fund Adequately Funded",
        summary:  `Emergency fund covers ${months} of expenses.`,
        details:  `Your emergency fund covers ${months} of monthly expenses, within the 3–6 month healthy range, and has remained stable over the analysis period.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    // ─── Unhealthy: below minimum ─────────────────────────────────────────────
    const severity = value < CRITICAL_MONTHS
      ? InsightSeverityLevel.CRITICAL
      : value < VERY_LOW_MONTHS
        ? InsightSeverityLevel.HIGH
        : InsightSeverityLevel.MEDIUM;

    if (direction === TrendDirection.IMPROVING) {
      return [buildInsight({
        metric:   MetricType.EMERGENCY_FUND_COVERAGE,
        category: InsightMetricCategory.EMERGENCY_FUND,
        type:     InsightType.OPPORTUNITY,
        severity,
        title:    "Emergency Fund Building Up",
        summary:  `Emergency fund covers ${months} of expenses — below the 3-month minimum but growing.`,
        details:  `With ${months} of expense coverage, the emergency fund is below the 3-month minimum, but the upward trend indicates it is being actively built up.`,
        confidence,
        supportingTrends: trend ? [trend] : [],
      })];
    }

    return [buildInsight({
      metric:   MetricType.EMERGENCY_FUND_COVERAGE,
      category: InsightMetricCategory.EMERGENCY_FUND,
      type:     InsightType.RISK,
      severity,
      title:    value < CRITICAL_MONTHS
        ? "Emergency Fund Critically Low"
        : value < VERY_LOW_MONTHS
          ? "Emergency Fund Dangerously Thin"
          : "Emergency Fund Below Minimum",
      summary:  `Emergency fund covers only ${months} of expenses — below the 3-month minimum.`,
      details:  `With ${months} of expense coverage, the emergency fund provides an insufficient buffer against income disruption. The standard minimum is 3 months; the ideal is 6 months. ${direction === TrendDirection.DECLINING ? "The downward trend indicates the buffer is being further eroded." : ""}`.trim(),
      confidence,
      supportingTrends: trend ? [trend] : [],
    })];
  }
}
