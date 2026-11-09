import type { ITrendAnalyzer } from "../ITrendAnalyzer";
import type { MetricTrendResult } from "../MetricTrendResult";
import type { TrendDataPoint } from "../TrendDataPoint";
import type { TrendStats } from "../TrendStats";
import type { MetricType } from "../../metrics/MetricType";
import { TrendDirection } from "../TrendDirection";
import { TrendStrength } from "../TrendStrength";
import { linearRegression } from "../algorithms/LinearRegression";
import { simpleMovingAverage } from "../algorithms/MovingAverage";
import { calculateVolatility } from "../algorithms/VolatilityCalculator";
import { classifyDirection, classifyStrength, isHigherBetter } from "../algorithms/TrendClassifier";

const MINIMUM_DATA_POINTS = 2;
const MOVING_AVERAGE_WINDOW = 3;
/** Confidence is scaled by data quantity: full trust at 6+ periods. */
const CONFIDENCE_FULL_DATA_PERIODS = 6;

/**
 * Production trend analyzer for all standard financial metrics.
 *
 * Algorithm:
 *   1. OLS linear regression over the index series gives slope and R².
 *   2. Volatility CV classifies VOLATILE before direction is considered.
 *   3. normalizedSlope = slope / |mean| makes strength scale-independent.
 *   4. MetricDefinition.threshold semantics determine whether rising = improving.
 *   5. Confidence = R² × min(1, n / 6) penalises short series.
 */
export class DefaultMetricTrendAnalyzer implements ITrendAnalyzer {
  analyze(dataPoints: ReadonlyArray<TrendDataPoint>): MetricTrendResult {
    if (dataPoints.length === 0) {
      throw new Error("DefaultMetricTrendAnalyzer.analyze: dataPoints must not be empty");
    }

    if (dataPoints.length < MINIMUM_DATA_POINTS) {
      return this.insufficientDataResult(dataPoints);
    }

    const firstPoint = dataPoints[0]!;
    const values = dataPoints.map((p) => p.value);

    const regression = linearRegression(values);
    const volatility = calculateVolatility(values);

    const firstValue = values[0]!;
    const lastValue = values[values.length - 1]!;
    const absoluteChange = lastValue - firstValue;
    const percentageChange =
      firstValue !== 0 ? (absoluteChange / Math.abs(firstValue)) * 100 : 0;
    const velocity = absoluteChange / (values.length - 1);

    const rollingAverage = values.reduce((s, v) => s + v, 0) / values.length;

    const windowSize = Math.min(MOVING_AVERAGE_WINDOW, values.length);
    const sma = simpleMovingAverage(values, windowSize);
    const latestMovingAverage = sma.length > 0 ? sma[sma.length - 1]! : rollingAverage;

    const consistency = this.computeConsistency(values);
    const dataQuantityFactor = Math.min(1, values.length / CONFIDENCE_FULL_DATA_PERIODS);
    const confidence = regression.rSquared * dataQuantityFactor;

    const normalizedSlope =
      rollingAverage !== 0
        ? regression.slope / Math.abs(rollingAverage)
        : regression.slope;

    const higherBetter = isHigherBetter(firstPoint.definition);
    const direction = classifyDirection(
      normalizedSlope,
      higherBetter,
      volatility.coefficientOfVariation,
    );
    const strength =
      direction === TrendDirection.VOLATILE ||
      direction === TrendDirection.INSUFFICIENT_DATA ||
      direction === TrendDirection.STABLE
        ? TrendStrength.NONE
        : classifyStrength(Math.abs(normalizedSlope));

    const stats: TrendStats = {
      absoluteChange,
      percentageChange,
      rollingAverage,
      latestMovingAverage,
      velocity,
      volatility: volatility.coefficientOfVariation,
      standardDeviation: volatility.standardDeviation,
      linearRegressionSlope: regression.slope,
      rSquared: regression.rSquared,
      consistency,
      confidence,
    };

    return {
      metricType: firstPoint.metricType,
      direction,
      strength,
      isHigherBetter: higherBetter,
      stats,
      dataPoints,
      periodsAnalyzed: dataPoints.length,
      analyzedAt: new Date(),
    };
  }

  private computeConsistency(values: readonly number[]): number {
    if (values.length < 2) return 0;
    const first = values[0]!;
    const last = values[values.length - 1]!;
    const overallDir = last >= first ? 1 : -1;
    let aligned = 0;
    for (let i = 1; i < values.length; i++) {
      const cur = values[i]!;
      const prev = values[i - 1]!;
      const stepDir = cur > prev ? 1 : cur < prev ? -1 : 0;
      if (stepDir === overallDir) aligned++;
    }
    return aligned / (values.length - 1);
  }

  private insufficientDataResult(
    dataPoints: ReadonlyArray<TrendDataPoint>,
  ): MetricTrendResult {
    const point = dataPoints[0]!;
    const emptyStats: TrendStats = {
      absoluteChange: 0,
      percentageChange: 0,
      rollingAverage: point.value,
      latestMovingAverage: point.value,
      velocity: 0,
      volatility: 0,
      standardDeviation: 0,
      linearRegressionSlope: 0,
      rSquared: 0,
      consistency: 0,
      confidence: 0,
    };
    return {
      metricType: point.metricType,
      direction: TrendDirection.INSUFFICIENT_DATA,
      strength: TrendStrength.NONE,
      isHigherBetter: isHigherBetter(point.definition),
      stats: emptyStats,
      dataPoints,
      periodsAnalyzed: dataPoints.length,
      analyzedAt: new Date(),
    };
  }
}
