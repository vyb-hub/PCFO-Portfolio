/**
 * Mathematical statistics produced by a single metric trend analysis pass.
 * All values are in the same unit as the underlying metric.
 */
export interface TrendStats {
  /** last − first */
  readonly absoluteChange: number;
  /** (last − first) / |first| × 100 */
  readonly percentageChange: number;
  /** Arithmetic mean of all observed values */
  readonly rollingAverage: number;
  /** Latest value of the trailing SMA (window = min(3, n)) */
  readonly latestMovingAverage: number;
  /** absoluteChange / (n − 1) — average change per period */
  readonly velocity: number;
  /** Coefficient of variation = stddev / |mean| */
  readonly volatility: number;
  /** Population standard deviation */
  readonly standardDeviation: number;
  /** OLS regression slope over the index series 0, 1, …, n-1 */
  readonly linearRegressionSlope: number;
  /** Coefficient of determination R² from OLS regression */
  readonly rSquared: number;
  /** Fraction of period-over-period steps aligned with the overall direction */
  readonly consistency: number;
  /** R² × min(1, n/6) — penalises short series */
  readonly confidence: number;
}
