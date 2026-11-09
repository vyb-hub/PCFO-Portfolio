import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricType } from "../../metrics/MetricType";
import type { AnalyticsAnalyzer } from "../AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "../AnalyzerDefinition";
import type { AnalyticsFinding } from "../AnalyticsFinding";
import { AnalysisFindingType } from "../AnalysisFindingType";
import { AnalyzerType } from "../AnalyzerType";
import { TrendDirection } from "../TrendDirection";

/** CoV above this threshold → HIGH_VARIANCE finding. */
const HIGH_VARIANCE_COV = 0.15;
/** CoV below this threshold → STABILITY finding. */
const STABLE_COV = 0.05;
/** Minimum snapshots to produce a meaningful variance observation. */
const MIN_SNAPSHOTS = 3;

/**
 * VarianceAnalyzer — measures the volatility of each metric over time.
 *
 * For each MetricType with ≥3 data points, computes the coefficient of
 * variation (CV = stddev / |mean|):
 *   - CV > 15%: produces a VARIANCE finding (direction = VOLATILE)
 *   - CV < 5% with ≥4 snapshots: produces a STABILITY finding
 *
 * High variance in income or cash flow suggests financial instability.
 * High variance in spending metrics suggests inconsistent behaviour.
 */
export class VarianceAnalyzer implements AnalyticsAnalyzer {
  private static readonly DEFINITION: AnalyzerDefinition = {
    id: AnalyzerType.VARIANCE,
    name: "Variance Analyzer",
    description: "Measures the volatility (coefficient of variation) of each metric across the historical window.",
    version: "1.0",
    minimumSnapshots: MIN_SNAPSHOTS,
  };

  definition(): AnalyzerDefinition {
    return VarianceAnalyzer.DEFINITION;
  }

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding> {
    const findings: AnalyticsFinding[] = [];
    const metricTypes = new Set<MetricType>();
    for (const s of snapshots) {
      for (const r of s.results) metricTypes.add(r.type);
    }

    for (const metricType of metricTypes) {
      const series = snapshots
        .map((s) => {
          const r = s.results.find((x) => x.type === metricType);
          return r ? { period: s.period.label, value: r.value, name: r.definition.name } : null;
        })
        .filter((e): e is { period: string; value: number; name: string } => e !== null);

      if (series.length < MIN_SNAPSHOTS) continue;

      const values = series.map((e) => e.value);
      const avg = _mean(values);
      if (avg === 0) continue;

      const stddev = _stddev(values);
      const cv = stddev / Math.abs(avg);
      const metricName = series[0]!.name;

      if (cv > HIGH_VARIANCE_COV) {
        findings.push({
          id: `${metricType}_VARIANCE`,
          type: AnalysisFindingType.VARIANCE,
          metricType,
          title: `${metricName} is Volatile`,
          description: `${metricName} fluctuated by ${(cv * 100).toFixed(1)}% (CV) across ${series.length} periods, indicating inconsistency.`,
          direction: TrendDirection.VOLATILE,
          magnitude: cv,
          confidence: Math.min(1, series.length / 6),
          periodsCovered: series.length,
          supportingValues: series.map((e) => ({ period: e.period, value: e.value })),
          detectedAt: new Date(),
        });
      } else if (cv < STABLE_COV && series.length >= 4) {
        findings.push({
          id: `${metricType}_STABILITY`,
          type: AnalysisFindingType.STABILITY,
          metricType,
          title: `${metricName} is Stable`,
          description: `${metricName} remained highly consistent across ${series.length} periods (CV ${(cv * 100).toFixed(1)}%).`,
          direction: TrendDirection.STABLE,
          magnitude: cv,
          confidence: Math.min(1, series.length / 6),
          periodsCovered: series.length,
          supportingValues: series.map((e) => ({ period: e.period, value: e.value })),
          detectedAt: new Date(),
        });
      }
    }

    return findings;
  }
}

function _mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function _stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = _mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}
