import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricType } from "../metrics/MetricType";
import type { ITrendEngine } from "./ITrendEngine";
import type { TrendReport, TrendAnalysisFailure } from "./TrendReport";
import type { MetricTrendResult } from "./MetricTrendResult";
import type { TrendDataPoint } from "./TrendDataPoint";
import { TrendAnalyzerRegistry } from "./TrendAnalyzerRegistry";
import { buildTrendPeriod } from "./TrendPeriod";

const MINIMUM_DATA_POINTS_FOR_TREND = 2;

/**
 * Orchestrates trend analysis across all metrics in a snapshot window.
 *
 * For each MetricType present in ≥2 snapshots:
 *   1. Extracts a chronological TrendDataPoint series.
 *   2. Delegates to the ITrendAnalyzer registered for that type.
 *   3. Captures per-metric failures without aborting the whole run.
 */
export class TrendEngine implements ITrendEngine {
  constructor(private readonly registry: TrendAnalyzerRegistry) {}

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): TrendReport {
    if (snapshots.length === 0) {
      throw new Error("TrendEngine.analyze: at least one snapshot is required");
    }

    const userId = snapshots[0]!.userId;
    this.validateUserIds(snapshots, userId);

    const sorted = [...snapshots].sort(
      (a, b) => a.period.range.start.getTime() - b.period.range.start.getTime(),
    );

    const periodLabels = sorted.map((s) => s.period.label);
    const firstLabel = periodLabels[0]!;
    const lastLabel = periodLabels[periodLabels.length - 1]!;

    const metricTypes = this.collectMetricTypes(sorted);
    const trends: MetricTrendResult[] = [];
    const failures: TrendAnalysisFailure[] = [];

    for (const metricType of metricTypes) {
      try {
        const dataPoints = this.extractSeries(sorted, metricType);
        if (dataPoints.length < MINIMUM_DATA_POINTS_FOR_TREND) continue;

        const analyzer = this.registry.get(metricType);
        const trend = analyzer.analyze(dataPoints);
        trends.push(trend);
      } catch (err) {
        failures.push({
          metricType,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    return {
      userId,
      analyzedPeriod: buildTrendPeriod(firstLabel, lastLabel, sorted.length),
      trends,
      failures,
      metadata: {
        snapshotsAnalyzed: sorted.length,
        metricsAnalyzed: trends.length,
        metricsWithFailures: failures.length,
        coversPeriodLabels: periodLabels,
      },
      generatedAt: new Date(),
    };
  }

  private validateUserIds(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
    expectedUserId: string,
  ): void {
    for (const snapshot of snapshots) {
      if (snapshot.userId !== expectedUserId) {
        throw new Error(
          `TrendEngine.analyze: mixed userId — expected "${expectedUserId}", got "${snapshot.userId}"`,
        );
      }
    }
  }

  private collectMetricTypes(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
  ): Set<MetricType> {
    const types = new Set<MetricType>();
    for (const s of snapshots) {
      for (const r of s.results) types.add(r.type);
    }
    return types;
  }

  private extractSeries(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
    metricType: MetricType,
  ): ReadonlyArray<TrendDataPoint> {
    const series: TrendDataPoint[] = [];
    for (const s of snapshots) {
      const result = s.results.find((r) => r.type === metricType);
      if (result) {
        series.push({
          period: s.period.label,
          value: result.value,
          metricType: result.type,
          unit: result.unit,
          definition: result.definition,
        });
      }
    }
    return series;
  }
}
