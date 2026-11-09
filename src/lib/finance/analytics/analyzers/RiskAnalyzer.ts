import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricResult } from "../../metrics/MetricResult";
import type { AnalyticsAnalyzer } from "../AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "../AnalyzerDefinition";
import type { AnalyticsFinding } from "../AnalyticsFinding";
import { AnalysisFindingType } from "../AnalysisFindingType";
import { AnalyzerType } from "../AnalyzerType";
import { TrendDirection } from "../TrendDirection";

/**
 * Fraction of threshold remaining before a RISK finding is raised.
 * A metric within 15% of its max threshold → "approaching" risk.
 */
const THRESHOLD_PROXIMITY = 0.15;

/**
 * RiskAnalyzer — identifies metrics approaching or breaching healthy thresholds.
 *
 * For each metric in the most recent snapshot that has a threshold:
 *   1. Checks proximity: is the current value within 15% of the max limit?
 *   2. Checks trend: is the metric moving toward the limit (using the last 2 values)?
 *
 * Both conditions → HIGH_RISK finding.
 * Threshold breach only (no recent trend data) → RISK finding.
 *
 * Focus: metrics with a defined max threshold (DTI, credit utilisation).
 * Also flags savings rate below threshold.min — critical risk of negative savings.
 */
export class RiskAnalyzer implements AnalyticsAnalyzer {
  private static readonly DEFINITION: AnalyzerDefinition = {
    id: AnalyzerType.RISK,
    name: "Risk Analyzer",
    description: "Identifies metrics approaching or breaching healthy thresholds.",
    version: "1.0",
    minimumSnapshots: 1,
  };

  definition(): AnalyzerDefinition {
    return RiskAnalyzer.DEFINITION;
  }

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding> {
    const findings: AnalyticsFinding[] = [];
    const latest = snapshots[snapshots.length - 1]!;
    const prior  = snapshots.length >= 2 ? snapshots[snapshots.length - 2]! : null;

    for (const result of latest.results) {
      const { threshold } = result.definition;
      if (!threshold) continue;

      // Check max threshold breach risk (e.g. DTI, credit utilisation)
      if (threshold.max !== null) {
        const proximity = threshold.max > 0 ? result.value / threshold.max : 0;
        const approaching = proximity >= (1 - THRESHOLD_PROXIMITY);
        const trendingToward = prior ? this._trendingTowardMax(prior, result) : false;

        if (approaching || result.value > threshold.max) {
          const supportingValues = this._buildSeries(snapshots, result.type);
          findings.push({
            id: `${result.type}_RISK`,
            type: AnalysisFindingType.RISK,
            metricType: result.type,
            title: `${result.definition.name} Risk`,
            description: this._maxRiskDescription(
              result,
              threshold.max,
              proximity,
              trendingToward,
            ),
            direction: TrendDirection.DECLINING,
            magnitude: result.value / threshold.max - 1, // negative = below threshold (safe), positive = breached
            confidence: trendingToward ? 0.85 : 0.65,
            periodsCovered: supportingValues.length,
            supportingValues,
            detectedAt: new Date(),
          });
        }
      }

      // Check min threshold breach risk (e.g. savings rate, cash flow)
      if (threshold.min !== null && result.value < threshold.min) {
        const supportingValues = this._buildSeries(snapshots, result.type);
        findings.push({
          id: `${result.type}_RISK`,
          type: AnalysisFindingType.RISK,
          metricType: result.type,
          title: `${result.definition.name} Below Minimum`,
          description:
            `${result.definition.name} is ${result.value.toFixed(3)}, ` +
            `below the minimum healthy level of ${threshold.min}.`,
          direction: TrendDirection.DECLINING,
          magnitude: result.value - threshold.min,
          confidence: 0.9,
          periodsCovered: supportingValues.length,
          supportingValues,
          detectedAt: new Date(),
        });
      }
    }

    return findings;
  }

  private _trendingTowardMax(
    prior: FinancialMetricsSnapshot,
    latest: MetricResult,
  ): boolean {
    const priorResult = prior.results.find((r) => r.type === latest.type);
    if (!priorResult) return false;
    return latest.value > priorResult.value;
  }

  private _buildSeries(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
    type: string,
  ): Array<{ period: string; value: number }> {
    return snapshots
      .map((s) => {
        const r = s.results.find((x) => x.type === type);
        return r ? { period: s.period.label, value: r.value } : null;
      })
      .filter((e): e is { period: string; value: number } => e !== null);
  }

  private _maxRiskDescription(
    result: MetricResult,
    maxThreshold: number,
    proximity: number,
    trendingToward: boolean,
  ): string {
    const pct = (proximity * 100).toFixed(1);
    const trend = trendingToward ? " and trending upward." : ".";
    if (result.value > maxThreshold) {
      return `${result.definition.name} is ${result.value.toFixed(3)}, exceeding the maximum of ${maxThreshold}${trend}`;
    }
    return (
      `${result.definition.name} is at ${pct}% of the maximum threshold (${maxThreshold})${trend}`
    );
  }
}
