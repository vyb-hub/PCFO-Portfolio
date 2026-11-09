/**
 * ContextEvaluator — EC-011A Reference Implementation
 *
 * Pure functions for magnitude-relative severity calibration.
 * No I/O, no side effects.
 *
 * Today, calibration is applied inline in the affected generators
 * (SavingsInsightGenerator rangeRef=0.5, CashFlowRecommendationGenerator
 * deficit < 2% of burn). This module documents the canonical logic so
 * that the full pipeline integration (planned for a future milestone) has a
 * clear starting point.
 */

import { InsightSeverityLevel as SL } from "../insights/InsightSeverityLevel";
import type { ContextEvaluation, ContextFactor } from "./ContextEvaluation";
import { MetricType } from "../metrics/MetricType";

// ── Savings Rate Context ───────────────────────────────────────────────────────

/**
 * Calibrate SAVINGS_RATE severity by normalising the distance against 0.5
 * (half-income range) rather than threshold.min (0.10).
 *
 * Threshold min = 0.10. Without this calibration, any negative savings rate
 * produces a normalised distance > 1.0 → CRITICAL, regardless of whether the
 * deficit is ₹1,500 or ₹1,50,000.
 *
 * Scale:
 *   distance / 0.5 ≤ 0.25  → MEDIUM  (−0% to −12.5% savings rate: marginal)
 *   distance / 0.5 ≤ 0.50  → HIGH    (−12.5% to −25%: meaningful)
 *   distance / 0.5 > 0.50  → CRITICAL (< −25%: severe)
 */
export function calibrateSavingsRateSeverity(
  distanceFromThreshold: number,
): { severity: SL; context: ContextEvaluation } {
  const RANGE_REF = 0.5;
  const normalised = Math.abs(distanceFromThreshold) / RANGE_REF;

  let severity: SL;
  if (distanceFromThreshold >= 0) severity = SL.LOW;
  else if (normalised > 0.50) severity = SL.CRITICAL;
  else if (normalised > 0.25) severity = SL.HIGH;
  else severity = SL.MEDIUM;

  const factor: ContextFactor = {
    kind: "MAGNITUDE_RELATIVE",
    value: normalised,
    influence: normalised > 0.50 ? "ELEVATE" : normalised > 0.25 ? "NEUTRAL" : "REDUCE",
    description:
      `Savings deficit is ${(normalised * 50).toFixed(1)}% of income (range ref = 50%). ` +
      `CRITICAL threshold requires a deficit exceeding 25% of income.`,
  };

  return {
    severity,
    context: {
      metricType: MetricType.SAVINGS_RATE,
      originalSeverity: SL.CRITICAL,
      adjustedSeverity: severity,
      factors: [factor],
      calibrationNote:
        `rangeRef=0.5 applied: normalised distance = ${normalised.toFixed(3)}. ` +
        `Raw threshold-based normalisation would have returned CRITICAL for any negative savings rate.`,
    },
  };
}

// ── Cash Flow Context ─────────────────────────────────────────────────────────

/**
 * A cash flow deficit is CRITICAL only when it is ≥ 2% of monthly burn.
 * Sub-2% deficits are HIGH — they signal overspend but not financial emergency.
 *
 * Rationale: on ₹2L monthly income, a ₹1,600 overspend (0.8%) is a rounding
 * difference, not a structural problem. ₹4,000+ (2%+) warrants escalation.
 */
export function calibrateCashFlowPriority(
  deficit: number,
  burnRate: number,
): { isMarginal: boolean; deficitRatio: number } {
  if (burnRate <= 0) return { isMarginal: false, deficitRatio: 0 };
  const deficitRatio = deficit / burnRate;
  return { isMarginal: deficitRatio < 0.02, deficitRatio };
}
