import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { AnalyticsFinding } from "../../analytics/AnalyticsFinding";
import type { InsightGenerator } from "../InsightGenerator";
import type { InsightGeneratorDefinition } from "../InsightGeneratorDefinition";
import type { Insight } from "../Insight";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { TrendDirection } from "../../analytics/TrendDirection";
import { MetricType } from "../../metrics/MetricType";
import { InsightCategory } from "../InsightCategory";
import { InsightSeverity } from "../InsightSeverity";
import { InsightConfidence, toInsightConfidence } from "../InsightConfidence";
import { InsightGeneratorType } from "../InsightGeneratorType";

/**
 * Threshold at which a declining magnitude is considered significant enough
 * to escalate a WARNING to CRITICAL.
 */
const CRITICAL_MAGNITUDE_THRESHOLD = 0.20;

/**
 * Metrics where IMPROVING direction in TrendAnalyzer means "rising value" —
 * but rising is actually concerning (no health threshold, lower is better).
 */
const LOWER_IS_BETTER_NO_THRESHOLD = new Set<string>([
  MetricType.BURN_RATE,
  MetricType.RECURRING_SPEND,
]);

const METRIC_CATEGORY: Partial<Record<string, InsightCategory>> = {
  [MetricType.SAVINGS_RATE]:        InsightCategory.SAVINGS,
  [MetricType.CASH_FLOW]:           InsightCategory.CASH_FLOW,
  [MetricType.BURN_RATE]:           InsightCategory.SPENDING,
  [MetricType.NET_WORTH]:           InsightCategory.GOALS,
  [MetricType.DEBT_TO_INCOME_RATIO]:  InsightCategory.DEBT,
  [MetricType.CREDIT_UTILIZATION]:  InsightCategory.DEBT,
  [MetricType.RECURRING_SPEND]:     InsightCategory.SPENDING,
};

/**
 * TrendInsightGenerator — interprets TREND findings from TrendAnalyzer.
 *
 * For each TREND finding:
 *   IMPROVING + threshold-bearing metric  → INFO (positive development)
 *   DECLINING + threshold-bearing metric  → WARNING (deteriorating)
 *   DECLINING + large magnitude           → CRITICAL
 *   Rising no-threshold metric (BURN_RATE, RECURRING_SPEND) → WARNING
 *   Declining no-threshold metric         → INFO
 *   STABLE                                → skip (not meaningful enough)
 */
export class TrendInsightGenerator implements InsightGenerator {
  private static readonly DEFINITION: InsightGeneratorDefinition = {
    id:          InsightGeneratorType.TREND,
    name:        "Trend Insight Generator",
    description: "Interprets directional metric trends as insights.",
    version:     "1.0",
  };

  definition(): InsightGeneratorDefinition {
    return TrendInsightGenerator.DEFINITION;
  }

  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight> {
    const insights: Insight[] = [];

    for (const finding of snapshot.findings) {
      if (finding.type !== AnalysisFindingType.TREND) continue;
      if (!finding.direction || finding.direction === TrendDirection.STABLE) continue;

      const insight = this._toInsight(finding);
      if (insight) insights.push(insight);
    }

    return insights;
  }

  private _toInsight(finding: AnalyticsFinding): Insight | null {
    const metricKey = finding.metricType ?? "";
    const category  = METRIC_CATEGORY[metricKey] ?? InsightCategory.BEHAVIOUR;
    const lowerIsBetter = LOWER_IS_BETTER_NO_THRESHOLD.has(metricKey);

    const direction = finding.direction!;
    const improving =
      lowerIsBetter
        ? direction === TrendDirection.DECLINING  // declining value = good for these metrics
        : direction === TrendDirection.IMPROVING;

    const magnitude = Math.abs(finding.magnitude ?? 0);
    const isCritical = !improving && magnitude >= CRITICAL_MAGNITUDE_THRESHOLD;

    const severity: InsightSeverity = improving
      ? InsightSeverity.INFO
      : isCritical
        ? InsightSeverity.CRITICAL
        : InsightSeverity.WARNING;

    const confidence = toInsightConfidence(finding.confidence);

    // Skip low-confidence improving trends — not meaningful enough to surface
    if (improving && confidence === InsightConfidence.LOW) return null;

    const pct = (magnitude * 100).toFixed(1);
    const directionWord = improving ? "improving" : "deteriorating";
    const metricName = finding.title.replace(/ Trend$/, "");

    const title = improving
      ? `${metricName} is trending positively`
      : `${metricName} is ${directionWord}`;

    const description = `${metricName} ${finding.description} ` +
      `Change over the period: ${pct}%.`;

    return {
      id:                   `${finding.id}_INSIGHT`,
      category,
      severity,
      confidence,
      title,
      description,
      supportingFindingIds: [finding.id],
      generatedAt:          new Date(),
    };
  }
}
