/**
 * Direction of change for a metric over the analysis window.
 *
 * Distinct from analytics/TrendDirection: includes INSUFFICIENT_DATA
 * for series with fewer than 2 observations.
 *
 * IMPROVING / DECLINING are health-relative:
 *   - For metrics where higher is better (savings rate): rising = IMPROVING.
 *   - For metrics where lower is better (DTI, credit utilisation): falling = IMPROVING.
 *
 * VOLATILE: coefficient of variation > 25% — variance dominates over direction.
 * STABLE: normalised slope magnitude < 2% per period — effectively no movement.
 * INSUFFICIENT_DATA: fewer than 2 data points — direction cannot be determined.
 */
export enum TrendDirection {
  IMPROVING         = "IMPROVING",
  DECLINING         = "DECLINING",
  STABLE            = "STABLE",
  VOLATILE          = "VOLATILE",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
}
