/**
 * Pure helpers shared by every IInsightGenerator.
 * No side effects, no I/O, fully deterministic.
 */
import type { MetricEvaluation } from "../../metrics/MetricResult";
import type { MetricType, MetricUnit } from "../../metrics/MetricType";
import type { MetricThreshold } from "../../metrics/MetricDefinition";
import type { MetricTrendResult } from "../../trends/MetricTrendResult";
import type { TrendReport } from "../../trends/TrendReport";
import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { FinancialInsight } from "../FinancialInsight";
import type { InsightMetricCategory } from "../InsightMetricCategory";
import type { InsightSeverityLevel } from "../InsightSeverityLevel";
import type { InsightType } from "../InsightType";
import { TrendDirection } from "../../trends/TrendDirection";

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function findEvaluation(
  snapshot: FinancialMetricsSnapshot,
  type: MetricType,
): MetricEvaluation | undefined {
  return snapshot.evaluations.find(e => e.result.type === type);
}

export function findTrend(
  report: TrendReport,
  type: MetricType,
): MetricTrendResult | undefined {
  return report.trends.find(t => t.metricType === type);
}

// ─── Confidence ──────────────────────────────────────────────────────────────

/**
 * Derive insight confidence from a MetricTrendResult.
 * Falls back to 0.50 when no trend is available (single snapshot).
 */
export function computeConfidence(trend: MetricTrendResult | undefined): number {
  if (!trend) return 0.50;
  if (trend.direction === TrendDirection.INSUFFICIENT_DATA) return 0.30;
  if (trend.direction === TrendDirection.VOLATILE) return 0.40;
  return trend.stats.confidence;
}

// ─── Severity ─────────────────────────────────────────────────────────────────

import { InsightSeverityLevel as SL } from "../InsightSeverityLevel";

/**
 * Map a negative distanceFromThreshold to an InsightSeverityLevel.
 *
 * Distance is normalised against the threshold boundary so that "20%
 * below a min of 0.20" and "2 months below a min of 3" both produce the
 * same relative severity reading.
 *
 * `rangeRef` overrides the normalisation base. Use when the threshold value
 * is small relative to the full realistic range of the metric — e.g. a
 * SAVINGS_RATE threshold of 0.10 would make -0.8% appear as CRITICAL
 * (distance 1.08×) when it is economically trivial. Passing rangeRef=0.5
 * scales severity against half the income range instead.
 */
export function severityFromDistance(
  distance: number,
  threshold: MetricThreshold | null,
  rangeRef?: number,
): InsightSeverityLevel {
  if (distance >= 0) return SL.LOW;
  const bound = threshold?.min ?? threshold?.max ?? null;
  const defaultRef = bound !== null && bound !== 0 ? Math.abs(bound) : 1.0;
  const ref = rangeRef ?? defaultRef;
  const normalised = Math.abs(distance) / ref;
  if (normalised > 0.50) return SL.CRITICAL;
  if (normalised > 0.25) return SL.HIGH;
  return SL.MEDIUM;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function fmtValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case "PERCENTAGE":
    case "RATIO":
      return `${(value * 100).toFixed(1)}%`;
    case "MONTHS":
      return `${value.toFixed(1)} months`;
    case "CURRENCY":
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    default:
      return value.toFixed(2);
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildInsight(params: {
  metric: MetricType;
  category: InsightMetricCategory;
  type: InsightType;
  severity: InsightSeverityLevel;
  title: string;
  summary: string;
  details: string;
  confidence: number;
  supportingMetrics?: ReadonlyArray<MetricType>;
  supportingTrends?: ReadonlyArray<MetricTrendResult>;
}): FinancialInsight {
  return Object.freeze({
    id: crypto.randomUUID(),
    metric: params.metric,
    category: params.category,
    type: params.type,
    severity: params.severity,
    title: params.title,
    summary: params.summary,
    details: params.details,
    confidence: Math.max(0, Math.min(1, params.confidence)),
    supportingMetrics: params.supportingMetrics ?? [],
    supportingTrends: params.supportingTrends ?? [],
    createdAt: new Date(),
  });
}
