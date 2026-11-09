import type { MetricType } from "../metrics/MetricType";
import type { MetricTrendResult } from "./MetricTrendResult";
import type { TrendPeriod } from "./TrendPeriod";

export interface TrendAnalysisFailure {
  readonly metricType: MetricType;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

export interface TrendReportMetadata {
  readonly snapshotsAnalyzed: number;
  readonly metricsAnalyzed: number;
  readonly metricsWithFailures: number;
  readonly coversPeriodLabels: ReadonlyArray<string>;
}

/**
 * Immutable output of a TrendEngine.analyze() call.
 * Contains the trend analysis for every metric present in ≥2 snapshots.
 */
export interface TrendReport {
  readonly userId: string;
  readonly analyzedPeriod: TrendPeriod;
  readonly trends: ReadonlyArray<MetricTrendResult>;
  readonly failures: ReadonlyArray<TrendAnalysisFailure>;
  readonly metadata: TrendReportMetadata;
  readonly generatedAt: Date;
}
