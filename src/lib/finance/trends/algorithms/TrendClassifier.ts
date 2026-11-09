import type { MetricDefinition } from "../../metrics/MetricDefinition";
import { TrendDirection } from "../TrendDirection";
import { TrendStrength } from "../TrendStrength";

/** Minimum normalised slope magnitude to produce a directional classification. */
const STABLE_THRESHOLD = 0.02;
/**
 * CV above this level classifies the series as VOLATILE.
 * A linear progression from 10% to 30% savings rate has CV ≈ 0.35,
 * so the threshold must be above 0.35 to avoid false positives.
 * Genuinely erratic series (e.g. 10%, 80%, 5%, 90%) produce CV ≈ 0.99.
 */
const VOLATILE_CV = 0.50;
/** Normalised slope thresholds for strength classification. */
const STRONG_THRESHOLD    = 0.10;
const MODERATE_THRESHOLD  = 0.05;

/**
 * Returns true when a rising value indicates improving health.
 *
 * Logic mirrors the existing analytics/analyzers/TrendAnalyzer._direction():
 *   - max-only threshold (DTI, credit utilisation, burn rate cap) → lower is better
 *   - all other cases (min-only, both bounds, no threshold) → higher is better
 */
export function isHigherBetter(definition: MetricDefinition): boolean {
  const { threshold } = definition;
  if (!threshold) return true;
  if (threshold.max !== null && threshold.min === null) return false;
  return true;
}

/**
 * Classifies trend direction from normalised slope and volatility CV.
 *
 * normalizedSlope = regression slope / |mean| (scale-independent).
 */
export function classifyDirection(
  normalizedSlope: number,
  higherIsBetter: boolean,
  volatilityCv: number,
): TrendDirection {
  if (volatilityCv >= VOLATILE_CV) return TrendDirection.VOLATILE;
  if (Math.abs(normalizedSlope) < STABLE_THRESHOLD) return TrendDirection.STABLE;

  const isRising = normalizedSlope > 0;
  return isRising === higherIsBetter ? TrendDirection.IMPROVING : TrendDirection.DECLINING;
}

/**
 * Classifies movement strength from the absolute normalised slope.
 * Should only be called when direction is IMPROVING or DECLINING.
 */
export function classifyStrength(absNormalizedSlope: number): TrendStrength {
  if (absNormalizedSlope >= STRONG_THRESHOLD)    return TrendStrength.STRONG;
  if (absNormalizedSlope >= MODERATE_THRESHOLD)  return TrendStrength.MODERATE;
  if (absNormalizedSlope >= STABLE_THRESHOLD)    return TrendStrength.WEAK;
  return TrendStrength.NONE;
}
