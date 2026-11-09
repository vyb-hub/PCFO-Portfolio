import { describe, it, expect } from "vitest";
import { TrendDirection } from "../../trends/TrendDirection";
import { InsightSeverityLevel } from "../InsightSeverityLevel";
import { InsightType } from "../InsightType";
import { InsightMetricCategory } from "../InsightMetricCategory";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import {
  computeConfidence,
  severityFromDistance,
  buildInsight,
} from "../generators/InsightBuilder";
import { makeTrendResult, makeThreshold } from "./testHelpers";

describe("computeConfidence", () => {
  it("returns 0.50 when no trend is provided", () => {
    expect(computeConfidence(undefined)).toBe(0.50);
  });

  it("returns 0.30 for INSUFFICIENT_DATA direction", () => {
    const trend = makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.INSUFFICIENT_DATA, 0.90);
    expect(computeConfidence(trend)).toBe(0.30);
  });

  it("returns 0.40 for VOLATILE direction", () => {
    const trend = makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.VOLATILE, 0.90);
    expect(computeConfidence(trend)).toBe(0.40);
  });

  it("returns the trend stats.confidence for IMPROVING direction", () => {
    const trend = makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING, 0.75);
    expect(computeConfidence(trend)).toBe(0.75);
  });

  it("returns the trend stats.confidence for DECLINING direction", () => {
    const trend = makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.DECLINING, 0.60);
    expect(computeConfidence(trend)).toBe(0.60);
  });
});

describe("severityFromDistance", () => {
  const threshold = makeThreshold(0.20, null);  // savings rate min = 20%

  it("returns LOW for distance >= 0 (inside healthy range)", () => {
    expect(severityFromDistance(0.05, threshold)).toBe(InsightSeverityLevel.LOW);
    expect(severityFromDistance(0, threshold)).toBe(InsightSeverityLevel.LOW);
  });

  it("returns MEDIUM for small negative distance (< 25% of boundary)", () => {
    // distance = -0.03, boundary = 0.20, normalised = 0.15 → MEDIUM
    expect(severityFromDistance(-0.03, threshold)).toBe(InsightSeverityLevel.MEDIUM);
  });

  it("returns HIGH for moderate negative distance (25–50% of boundary)", () => {
    // distance = -0.07, boundary = 0.20, normalised = 0.35 → HIGH
    expect(severityFromDistance(-0.07, threshold)).toBe(InsightSeverityLevel.HIGH);
  });

  it("returns CRITICAL for large negative distance (> 50% of boundary)", () => {
    // distance = -0.12, boundary = 0.20, normalised = 0.60 → CRITICAL
    expect(severityFromDistance(-0.12, threshold)).toBe(InsightSeverityLevel.CRITICAL);
  });

  it("handles max-only threshold (DTI)", () => {
    const dtiThreshold = makeThreshold(null, 0.43);
    // distance = -0.15, boundary = 0.43, normalised = 0.35 → HIGH
    expect(severityFromDistance(-0.15, dtiThreshold)).toBe(InsightSeverityLevel.HIGH);
  });

  it("falls back to ref=1.0 when threshold is null", () => {
    // distance = -0.60, ref = 1.0, normalised = 0.60 → CRITICAL
    expect(severityFromDistance(-0.60, null)).toBe(InsightSeverityLevel.CRITICAL);
  });
});

describe("buildInsight", () => {
  const base = {
    metric:   MetricType.SAVINGS_RATE,
    category: InsightMetricCategory.SAVINGS,
    type:     InsightType.POSITIVE,
    severity: InsightSeverityLevel.LOW,
    title:    "Test Title",
    summary:  "Test summary.",
    details:  "Test details.",
    confidence: 0.80,
  };

  it("produces an insight with all required fields", () => {
    const insight = buildInsight(base);
    expect(insight.id).toBeTruthy();
    expect(insight.metric).toBe(MetricType.SAVINGS_RATE);
    expect(insight.category).toBe(InsightMetricCategory.SAVINGS);
    expect(insight.type).toBe(InsightType.POSITIVE);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
    expect(insight.title).toBe("Test Title");
    expect(insight.confidence).toBe(0.80);
    expect(insight.supportingMetrics).toEqual([]);
    expect(insight.supportingTrends).toEqual([]);
    expect(insight.createdAt).toBeInstanceOf(Date);
  });

  it("clamps confidence to [0, 1]", () => {
    expect(buildInsight({ ...base, confidence: 1.5 }).confidence).toBe(1.0);
    expect(buildInsight({ ...base, confidence: -0.1 }).confidence).toBe(0.0);
  });

  it("generates unique IDs for each call", () => {
    const a = buildInsight(base);
    const b = buildInsight(base);
    expect(a.id).not.toBe(b.id);
  });

  it("accepts supporting metrics and trends", () => {
    const trend = makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING);
    const insight = buildInsight({
      ...base,
      supportingMetrics: [MetricType.CASH_FLOW],
      supportingTrends: [trend],
    });
    expect(insight.supportingMetrics).toContain(MetricType.CASH_FLOW);
    expect(insight.supportingTrends).toHaveLength(1);
  });
});
