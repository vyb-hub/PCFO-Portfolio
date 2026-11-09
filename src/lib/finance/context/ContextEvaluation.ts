/**
 * ContextEvaluation — EC-011A Financial Signal Context & Severity Calibration
 *
 * A ContextEvaluation augments a MetricEvaluation with income-relative and
 * trend-aware factors BEFORE severity is assigned. It does not replace the
 * metric calculation or loosen financial thresholds. It answers the question:
 * "Given that this metric is unhealthy, how urgently does the user need to act?"
 *
 * Current usage: referenced by SavingsInsightGenerator (rangeRef override) and
 * CashFlowRecommendationGenerator (deficit magnitude check). The full pipeline
 * integration described below is the planned architecture for a future milestone.
 *
 * Future pipeline:
 *   MetricsSnapshot
 *     → ContextEvaluator.evaluate(metricEval, aggregate)
 *     → ContextEvaluation[]
 *     → InsightGenerators (pass context alongside evaluation)
 *     → Severity calibrated per context
 */

import type { MetricType } from "../metrics/MetricType";
import type { InsightSeverityLevel } from "../insights/InsightSeverityLevel";

// ── Context factors ────────────────────────────────────────────────────────────

export type ContextFactorKind =
  | "MAGNITUDE_RELATIVE"   // how large the deficit/violation is vs income/scale
  | "TREND_DIRECTION"      // improving, declining, stable
  | "COLD_START"           // insufficient historical data (< 3 snapshots)
  | "INCOME_SCALE";        // absolute income level modulates impact of absolute amounts

export interface ContextFactor {
  readonly kind: ContextFactorKind;
  /** Computed value of this factor (metric-specific meaning). */
  readonly value: number;
  /** Whether this factor reduces, is neutral, or elevates severity. */
  readonly influence: "REDUCE" | "NEUTRAL" | "ELEVATE";
  readonly description: string;
}

// ── ContextEvaluation ─────────────────────────────────────────────────────────

/**
 * A severity calibration result for a single metric.
 *
 * `adjustedSeverity` is the output used by insight generators.
 * `originalSeverity` is the raw distance-based result for audit trails.
 * `calibrationNote` is a human-readable reason for any adjustment.
 */
export interface ContextEvaluation {
  readonly metricType: MetricType;
  readonly originalSeverity: InsightSeverityLevel;
  readonly adjustedSeverity: InsightSeverityLevel;
  readonly factors: ReadonlyArray<ContextFactor>;
  readonly calibrationNote: string;
}
