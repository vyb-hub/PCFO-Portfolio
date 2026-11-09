import type { TrendDataPoint } from "../TrendDataPoint";

/**
 * A projected value for a future period with uncertainty bounds.
 */
export interface ForecastPoint {
  /** 0-based index relative to the last observed data point. */
  readonly periodIndex: number;
  readonly projectedValue: number;
  readonly lowerBound: number;
  readonly upperBound: number;
}

/**
 * Extension point for forward projections.
 * The simplest implementation extrapolates the OLS regression line.
 * More sophisticated implementations apply ARIMA or exponential smoothing.
 */
export interface IForecaster {
  forecast(
    dataPoints: ReadonlyArray<TrendDataPoint>,
    horizonPeriods: number,
  ): ReadonlyArray<ForecastPoint>;
}
