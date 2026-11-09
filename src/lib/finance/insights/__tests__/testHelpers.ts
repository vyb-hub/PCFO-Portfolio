/**
 * Shared test fixtures for the Financial Insight Engine test suite.
 */
import type { MetricResult, MetricEvaluation } from "../../metrics/MetricResult";
import type { MetricThreshold, MetricDefinition } from "../../metrics/MetricDefinition";
import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricTrendResult } from "../../trends/MetricTrendResult";
import type { TrendReport } from "../../trends/TrendReport";
import type { TrendStats } from "../../trends/TrendStats";
import { MetricType, MetricUnit, CalculationFrequency } from "../../metrics/MetricType";
import { MetricCategory } from "../../metrics/MetricCategory";
import { TrendDirection } from "../../trends/TrendDirection";
import { TrendStrength } from "../../trends/TrendStrength";
import { AggregateGranularity } from "../../aggregation/AggregatePeriod";

const NOW = new Date("2026-06-01T00:00:00Z");

const PERIOD = {
  range: { start: new Date("2026-06-01"), end: new Date("2026-06-30") },
  label: "2026-06",
  granularity: AggregateGranularity.MONTHLY,
};

export function makeThreshold(
  min: number | null,
  max: number | null,
): MetricThreshold {
  return { min, max, optimal: null, description: "test threshold" };
}

export function makeDefinition(
  type: MetricType,
  unit: MetricUnit,
  threshold: MetricThreshold | null = null,
): MetricDefinition {
  return {
    id:                   type,
    name:                 String(type),
    description:          "",
    category:             MetricCategory.SAVINGS,
    unit,
    version:              "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold,
  };
}

export function makeEvaluation(
  type: MetricType,
  value: number,
  threshold: MetricThreshold | null,
  isHealthy: boolean,
  distanceFromThreshold: number,
  unit: MetricUnit = MetricUnit.PERCENTAGE,
): MetricEvaluation {
  const definition = makeDefinition(type, unit, threshold);
  const result: MetricResult = {
    type,
    value,
    unit,
    period: PERIOD,
    calculatedAt: NOW,
    definition,
  };
  const thr: MetricThreshold = threshold ?? { min: null, max: null, optimal: null, description: "" };
  return { result, threshold: thr, isHealthy, distanceFromThreshold };
}

export function makeSnapshot(
  userId: string,
  evaluations: MetricEvaluation[],
): FinancialMetricsSnapshot {
  return {
    userId,
    period: PERIOD,
    metadata: {
      userId,
      generatedAt: NOW,
      aggregatedAt: NOW,
      version: { major: 1, minor: 0, patch: 0 },
      totalAttempted: evaluations.length,
      successfulMetrics: evaluations.length,
      failedMetrics: 0,
    },
    results:     evaluations.map(e => e.result),
    evaluations,
    failures:    [],
    definitions: evaluations.map(e => e.result.definition),
  };
}

const DEFAULT_STATS: TrendStats = {
  absoluteChange:        0.05,
  percentageChange:      20,
  rollingAverage:        0.25,
  latestMovingAverage:   0.27,
  velocity:              0.01,
  volatility:            0.10,
  standardDeviation:     0.02,
  linearRegressionSlope: 0.01,
  rSquared:              0.80,
  consistency:           0.80,
  confidence:            0.80,
};

export function makeTrendResult(
  metricType: MetricType,
  direction: TrendDirection,
  confidence = 0.80,
  isHigherBetter = true,
): MetricTrendResult {
  return {
    metricType,
    direction,
    strength: TrendStrength.MODERATE,
    isHigherBetter,
    stats: { ...DEFAULT_STATS, confidence, rSquared: confidence },
    dataPoints: [],
    periodsAnalyzed: 6,
    analyzedAt: NOW,
  };
}

export function makeReport(
  userId: string,
  trends: MetricTrendResult[],
): TrendReport {
  return {
    userId,
    analyzedPeriod: {
      firstPeriodLabel:  "2026-01",
      lastPeriodLabel:   "2026-06",
      periodsAnalyzed:   6,
      windowLabel:       "6P",
    },
    trends,
    failures:  [],
    metadata: {
      snapshotsAnalyzed:    6,
      metricsAnalyzed:      trends.length,
      metricsWithFailures:  0,
      coversPeriodLabels:   ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"],
    },
    generatedAt: NOW,
  };
}
