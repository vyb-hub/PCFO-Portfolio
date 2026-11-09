/**
 * Magnitude of the directional movement.
 *
 * Based on the normalised regression slope (slope / |mean|):
 *   STRONG   ≥ 10% per period
 *   MODERATE  5–10% per period
 *   WEAK      2–5% per period
 *   NONE     < 2% per period (includes STABLE, VOLATILE, INSUFFICIENT_DATA)
 */
export enum TrendStrength {
  STRONG   = "STRONG",
  MODERATE = "MODERATE",
  WEAK     = "WEAK",
  NONE     = "NONE",
}
