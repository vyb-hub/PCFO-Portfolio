import type { MetricType } from "../metrics/MetricType";
import type { AnalysisFindingType } from "./AnalysisFindingType";
import type { TrendDirection } from "./TrendDirection";

/**
 * A single deterministic analytical observation produced by an AnalyticsAnalyzer.
 *
 * AnalyticsFinding carries no advice or recommendations — it describes what
 * the numbers show. Interpretation (insight generation) belongs to the Insight
 * Platform, which consumes AnalyticsSnapshot.
 *
 * `supportingValues` is the time series that the finding was derived from,
 * ordered chronologically. Each entry carries the snapshot's period label
 * and the observed metric value for traceability.
 */
export interface AnalyticsFinding {
  /** Stable identifier — e.g. "SAVINGS_RATE_TREND". Multiple findings may share type; id differentiates. */
  readonly id: string;
  readonly type: AnalysisFindingType;
  /** Which metric this finding is about. null for multi-metric findings. */
  readonly metricType: MetricType | null;
  readonly title: string;
  /** Human-readable description of the observation. No advice, no imperative. */
  readonly description: string;
  /**
   * Direction of change, null when the finding type has no direction concept
   * (e.g. a SEASONALITY or STABILITY finding).
   */
  readonly direction: TrendDirection | null;
  /**
   * Signed fractional magnitude of change:
   *   positive = increase, negative = decrease.
   * Expressed as a decimal (0.08 = 8% increase).
   * null when magnitude is not applicable to the finding type.
   */
  readonly magnitude: number | null;
  /**
   * Statistical confidence that this finding reflects a real pattern (0–1).
   * Computed from consistency of the time series. Lower with fewer data points.
   */
  readonly confidence: number;
  /** Number of snapshots used to produce this finding. */
  readonly periodsCovered: number;
  /**
   * The time series the finding was derived from, oldest first.
   * `period` is the AggregatePeriod.label of the source snapshot.
   */
  readonly supportingValues: ReadonlyArray<{ readonly period: string; readonly value: number }>;
  readonly detectedAt: Date;
}
