/**
 * Direction of change for a metric over the analysis window.
 *
 * IMPROVING / DECLINING are health-relative:
 *   — IMPROVING means moving toward or staying within the healthy range.
 *   — DECLINING means moving away from the healthy range.
 *
 * For metrics with no threshold, IMPROVING / DECLINING are purely directional
 * (positive slope = IMPROVING, negative slope = DECLINING) with no health judgment.
 *
 * STABLE: change magnitude < 2% — effectively no movement.
 * VOLATILE: change direction flips frequently (captured by VarianceAnalyzer).
 */
export enum TrendDirection {
  IMPROVING = "IMPROVING",
  DECLINING = "DECLINING",
  STABLE    = "STABLE",
  VOLATILE  = "VOLATILE",
}
