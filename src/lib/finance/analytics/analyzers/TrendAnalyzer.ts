import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricDefinition } from "../../metrics/MetricDefinition";
import type { MetricResult } from "../../metrics/MetricResult";
import type { MetricType } from "../../metrics/MetricType";
import type { AnalyticsAnalyzer } from "../AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "../AnalyzerDefinition";
import type { AnalyticsFinding } from "../AnalyticsFinding";
import { AnalysisFindingType } from "../AnalysisFindingType";
import { AnalyzerType } from "../AnalyzerType";
import { TrendDirection } from "../TrendDirection";

/** Minimum absolute fractional change to produce a trend finding (2%). */
const STABLE_THRESHOLD = 0.02;

/**
 * TrendAnalyzer — detects directional change in each metric over time.
 *
 * For each MetricType present across ≥2 snapshots:
 *   1. Extracts the value time series in chronological order.
 *   2. Computes fractional magnitude: (latest − oldest) / |oldest|.
 *   3. Determines direction using the metric's threshold semantics:
 *      — Metrics with max threshold (DTI, credit utilisation): declining value = IMPROVING.
 *      — Metrics with min threshold (savings rate, cash flow, net worth): rising value = IMPROVING.
 *      — Metrics with no threshold: purely directional (no health judgment).
 *   4. Computes confidence as the fraction of period-over-period steps that
 *      moved in the same direction as the overall trend.
 *
 * Findings with |magnitude| < 2% are suppressed (classified as STABLE).
 */
export class TrendAnalyzer implements AnalyticsAnalyzer {
  private static readonly DEFINITION: AnalyzerDefinition = {
    id: AnalyzerType.TREND,
    name: "Trend Analyzer",
    description: "Detects the direction and magnitude of change in each metric across the historical window.",
    version: "1.0",
    minimumSnapshots: 2,
  };

  definition(): AnalyzerDefinition {
    return TrendAnalyzer.DEFINITION;
  }

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding> {
    const findings: AnalyticsFinding[] = [];

    const metricTypes = this._collectMetricTypes(snapshots);

    for (const metricType of metricTypes) {
      const series = this._extractSeries(snapshots, metricType);
      if (series.length < 2) continue;

      const values = series.map((e) => e.value);
      const first = values[0]!;
      const last = values[values.length - 1]!;
      const magnitude = first !== 0 ? (last - first) / Math.abs(first) : 0;

      if (Math.abs(magnitude) < STABLE_THRESHOLD) continue;

      const definition = series[series.length - 1]!.definition;
      const direction = this._direction(magnitude, definition);
      const confidence = this._confidence(values);

      findings.push({
        id: `${metricType}_TREND`,
        type: AnalysisFindingType.TREND,
        metricType,
        title: `${definition.name} Trend`,
        description: this._describe(definition.name, direction, magnitude, series.length),
        direction,
        magnitude,
        confidence,
        periodsCovered: series.length,
        supportingValues: series.map((e) => ({ period: e.period, value: e.value })),
        detectedAt: new Date(),
      });
    }

    return findings;
  }

  private _collectMetricTypes(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
  ): Set<MetricType> {
    const types = new Set<MetricType>();
    for (const s of snapshots) {
      for (const r of s.results) types.add(r.type);
    }
    return types;
  }

  private _extractSeries(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
    type: MetricType,
  ): Array<{ period: string; value: number; definition: MetricDefinition }> {
    const series: Array<{ period: string; value: number; definition: MetricDefinition }> = [];
    for (const s of snapshots) {
      const result = s.results.find((r) => r.type === type);
      if (result) {
        series.push({ period: s.period.label, value: result.value, definition: result.definition });
      }
    }
    return series;
  }

  private _direction(magnitude: number, definition: MetricDefinition): TrendDirection {
    const { threshold } = definition;
    const rising = magnitude > 0;

    if (!threshold) return rising ? TrendDirection.IMPROVING : TrendDirection.DECLINING;

    // Metrics where higher is healthier (min threshold only)
    if (threshold.min !== null && threshold.max === null) {
      return rising ? TrendDirection.IMPROVING : TrendDirection.DECLINING;
    }

    // Metrics where lower is healthier (max threshold only: DTI, credit utilisation)
    if (threshold.max !== null && threshold.min === null) {
      return rising ? TrendDirection.DECLINING : TrendDirection.IMPROVING;
    }

    // Default: treat rising as improving
    return rising ? TrendDirection.IMPROVING : TrendDirection.DECLINING;
  }

  private _confidence(values: number[]): number {
    if (values.length < 2) return 0;
    const overallDir = values[values.length - 1]! > values[0]! ? 1 : -1;
    let aligned = 0;
    for (let i = 1; i < values.length; i++) {
      const cur  = values[i]!;
      const prev = values[i - 1]!;
      const step = cur > prev ? 1 : (cur < prev ? -1 : 0);
      if (step === overallDir) aligned++;
    }
    return aligned / (values.length - 1);
  }

  private _describe(
    name: string,
    direction: TrendDirection,
    magnitude: number,
    periods: number,
  ): string {
    const pct = `${Math.abs(magnitude * 100).toFixed(1)}%`;
    const word = direction === TrendDirection.IMPROVING ? "improved" : "declined";
    return `${name} has ${word} by ${pct} over ${periods} period${periods === 1 ? "" : "s"}.`;
  }
}
