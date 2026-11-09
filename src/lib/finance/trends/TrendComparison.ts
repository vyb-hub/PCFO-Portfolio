import type { MetricType } from "../metrics/MetricType";
import type { MetricTrendResult } from "./MetricTrendResult";
import { TrendDirection } from "./TrendDirection";

export enum TrendComparisonSummary {
  ACCELERATING_IMPROVEMENT = "ACCELERATING_IMPROVEMENT",
  SLOWING_IMPROVEMENT      = "SLOWING_IMPROVEMENT",
  ACCELERATING_DECLINE     = "ACCELERATING_DECLINE",
  RECOVERING               = "RECOVERING",
  DETERIORATING            = "DETERIORATING",
  STABLE                   = "STABLE",
}

/**
 * Side-by-side comparison of the same metric's trend across two analysis windows.
 */
export interface TrendComparison {
  readonly metricType: MetricType;
  readonly baseline: MetricTrendResult;
  readonly current: MetricTrendResult;
  readonly directionChanged: boolean;
  readonly strengthChanged: boolean;
  readonly velocityDelta: number;
  readonly absoluteChangeDelta: number;
  readonly percentageChangeDelta: number;
  readonly summary: TrendComparisonSummary;
}

export function buildTrendComparison(
  baseline: MetricTrendResult,
  current: MetricTrendResult,
): TrendComparison {
  return {
    metricType: current.metricType,
    baseline,
    current,
    directionChanged: baseline.direction !== current.direction,
    strengthChanged: baseline.strength !== current.strength,
    velocityDelta: current.stats.velocity - baseline.stats.velocity,
    absoluteChangeDelta: current.stats.absoluteChange - baseline.stats.absoluteChange,
    percentageChangeDelta: current.stats.percentageChange - baseline.stats.percentageChange,
    summary: classifyComparisonSummary(baseline, current),
  };
}

function isPositiveDirection(direction: TrendDirection): boolean {
  return direction === TrendDirection.IMPROVING || direction === TrendDirection.STABLE;
}

function classifyComparisonSummary(
  baseline: MetricTrendResult,
  current: MetricTrendResult,
): TrendComparisonSummary {
  const baselinePositive = isPositiveDirection(baseline.direction);
  const currentPositive = isPositiveDirection(current.direction);

  if (!baselinePositive && currentPositive) return TrendComparisonSummary.RECOVERING;
  if (baselinePositive && !currentPositive) return TrendComparisonSummary.DETERIORATING;

  if (
    current.direction === TrendDirection.IMPROVING &&
    baseline.direction === TrendDirection.IMPROVING
  ) {
    const currMag = Math.abs(current.stats.linearRegressionSlope);
    const baseMag = Math.abs(baseline.stats.linearRegressionSlope);
    return currMag >= baseMag
      ? TrendComparisonSummary.ACCELERATING_IMPROVEMENT
      : TrendComparisonSummary.SLOWING_IMPROVEMENT;
  }

  if (
    current.direction === TrendDirection.DECLINING &&
    baseline.direction === TrendDirection.DECLINING
  ) {
    const currMag = Math.abs(current.stats.linearRegressionSlope);
    const baseMag = Math.abs(baseline.stats.linearRegressionSlope);
    return currMag >= baseMag
      ? TrendComparisonSummary.ACCELERATING_DECLINE
      : TrendComparisonSummary.STABLE;
  }

  return TrendComparisonSummary.STABLE;
}
