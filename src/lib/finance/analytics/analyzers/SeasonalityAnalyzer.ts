import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import { MetricType } from "../../metrics/MetricType";
import type { AnalyticsAnalyzer } from "../AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "../AnalyzerDefinition";
import type { AnalyticsFinding } from "../AnalyticsFinding";
import { AnalysisFindingType } from "../AnalysisFindingType";
import { AnalyzerType } from "../AnalyzerType";

/**
 * SeasonalityAnalyzer — detects recurring patterns across calendar quarters.
 *
 * Groups snapshots by calendar quarter (Q1: Jan–Mar, Q2: Apr–Jun,
 * Q3: Jul–Sep, Q4: Oct–Nov) and computes quarterly mean values.
 * When the CV of quarterly means exceeds 10%, a SEASONALITY finding is
 * produced naming the peak quarter.
 *
 * Focus metrics: BURN_RATE and RECURRING_SPEND — the most likely to
 * show calendar-driven peaks (year-end spending, summer travel, etc.).
 *
 * Requires ≥4 snapshots spanning at least 2 different quarters.
 */
export class SeasonalityAnalyzer implements AnalyticsAnalyzer {
  private static readonly DEFINITION: AnalyzerDefinition = {
    id: AnalyzerType.SEASONALITY,
    name: "Seasonality Analyzer",
    description: "Detects recurring calendar-quarter patterns in spending metrics.",
    version: "1.0",
    minimumSnapshots: 4,
  };

  private static readonly FOCUS_METRICS: ReadonlyArray<MetricType> = [
    MetricType.BURN_RATE,
    MetricType.RECURRING_SPEND,
  ];

  definition(): AnalyzerDefinition {
    return SeasonalityAnalyzer.DEFINITION;
  }

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding> {
    const findings: AnalyticsFinding[] = [];

    for (const metricType of SeasonalityAnalyzer.FOCUS_METRICS) {
      const series = snapshots
        .map((s) => {
          const r = s.results.find((x) => x.type === metricType);
          return r
            ? {
                period: s.period.label,
                value: r.value,
                quarter: _quarter(s.period.range.end),
                name: r.definition.name,
              }
            : null;
        })
        .filter((e): e is { period: string; value: number; quarter: number; name: string } => e !== null);

      if (series.length < 4) continue;

      const byQuarter = _groupByQuarter(series);
      const representedQuarters = byQuarter.filter((q) => q.values.length > 0);
      if (representedQuarters.length < 2) continue;

      const quarterlyMeans = representedQuarters.map((q) => _mean(q.values));
      const overallMean = _mean(series.map((e) => e.value));
      if (overallMean === 0) continue;

      const cv = _stddev(quarterlyMeans) / Math.abs(overallMean);
      if (cv < 0.10) continue;

      const peakIdx = quarterlyMeans.indexOf(Math.max(...quarterlyMeans));
      const peakQuarter = representedQuarters[peakIdx]!.label;

      const name = series[0]!.name;
      findings.push({
        id: `${metricType}_SEASONALITY`,
        type: AnalysisFindingType.SEASONALITY,
        metricType,
        title: `${name} Seasonal Pattern Detected`,
        description:
          `${name} shows a quarterly seasonal pattern (CV ${(cv * 100).toFixed(1)}%). ` +
          `Peak quarter: ${peakQuarter}.`,
        direction: null,
        magnitude: cv,
        confidence: Math.min(1, series.length / 8),
        periodsCovered: series.length,
        supportingValues: series.map((e) => ({ period: e.period, value: e.value })),
        detectedAt: new Date(),
      });
    }

    return findings;
  }
}

function _quarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

function _groupByQuarter(
  series: ReadonlyArray<{ value: number; quarter: number }>,
): Array<{ label: string; values: number[] }> {
  const quarters = [
    { label: "Q1 (Jan–Mar)", values: [] as number[] },
    { label: "Q2 (Apr–Jun)", values: [] as number[] },
    { label: "Q3 (Jul–Sep)", values: [] as number[] },
    { label: "Q4 (Oct–Dec)", values: [] as number[] },
  ];
  for (const e of series) {
    quarters[e.quarter - 1]!.values.push(e.value);
  }
  return quarters;
}

function _mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function _stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = _mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}
