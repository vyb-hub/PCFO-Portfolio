import { describe, it, expect } from "vitest";
import { FinancialInsightService } from "../FinancialInsightService";
import { FinancialInsightEngine } from "../FinancialInsightEngine";
import { FinancialInsightRegistry } from "../FinancialInsightRegistry";
import { SavingsInsightGenerator } from "../generators/SavingsInsightGenerator";
import { EmergencyFundInsightGenerator } from "../generators/EmergencyFundInsightGenerator";
import { InsightType } from "../InsightType";
import { InsightSeverityLevel } from "../InsightSeverityLevel";
import { InsightMetricCategory } from "../InsightMetricCategory";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { TrendDirection } from "../../trends/TrendDirection";
import { makeEvaluation, makeSnapshot, makeTrendResult, makeReport, makeThreshold } from "./testHelpers";

function makeService() {
  const registry = new FinancialInsightRegistry();
  registry.register(new SavingsInsightGenerator());
  registry.register(new EmergencyFundInsightGenerator());
  return new FinancialInsightService(new FinancialInsightEngine(registry));
}

function buildSnapshot() {
  // Savings: healthy + improving → POSITIVE, LOW
  // Emergency fund: below minimum + declining → RISK, MEDIUM
  const evaluations = [
    makeEvaluation(MetricType.SAVINGS_RATE, 0.28, makeThreshold(0.20, null), true, 0.08),
    makeEvaluation(MetricType.EMERGENCY_FUND_COVERAGE, 2.0, makeThreshold(3.0, null), false, -1.0, MetricUnit.MONTHS),
  ];
  const snap = makeSnapshot("u1", evaluations);
  const report = makeReport("u1", [
    makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING),
    makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.DECLINING, 0.7, true),
  ]);
  return { service: makeService(), snap, report };
}

describe("FinancialInsightService — generate", () => {
  it("delegates to engine and returns a snapshot", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.userId).toBe("u1");
  });
});

describe("FinancialInsightService — summarise", () => {
  it("returns the snapshot's existing summary", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const summary = service.summarise(result);
    expect(summary).toBe(result.summary);
  });
});

describe("FinancialInsightService — getByType", () => {
  it("returns only insights of the requested InsightType", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const positive = service.getByType(result, InsightType.POSITIVE);
    expect(positive.length).toBeGreaterThan(0);
    expect(positive.every(i => i.type === InsightType.POSITIVE)).toBe(true);
  });

  it("returns empty array when no insights match the type", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const milestones = service.getByType(result, InsightType.MILESTONE);
    expect(milestones).toHaveLength(0);
  });
});

describe("FinancialInsightService — getBySeverity", () => {
  it("filters correctly to MEDIUM severity", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const medium = service.getBySeverity(result, InsightSeverityLevel.MEDIUM);
    expect(medium.every(i => i.severity === InsightSeverityLevel.MEDIUM)).toBe(true);
  });
});

describe("FinancialInsightService — getByCategory", () => {
  it("returns only SAVINGS category insights", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const savings = service.getByCategory(result, InsightMetricCategory.SAVINGS);
    expect(savings.length).toBeGreaterThan(0);
    expect(savings.every(i => i.category === InsightMetricCategory.SAVINGS)).toBe(true);
  });

  it("returns only EMERGENCY_FUND category insights", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const ef = service.getByCategory(result, InsightMetricCategory.EMERGENCY_FUND);
    expect(ef.length).toBeGreaterThan(0);
    expect(ef.every(i => i.category === InsightMetricCategory.EMERGENCY_FUND)).toBe(true);
  });
});

describe("FinancialInsightService — getUrgent / getHighlights", () => {
  it("getUrgent returns CRITICAL + HIGH insights only", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const urgent = service.getUrgent(result);
    expect(urgent.every(i =>
      i.severity === InsightSeverityLevel.CRITICAL || i.severity === InsightSeverityLevel.HIGH,
    )).toBe(true);
  });

  it("getHighlights returns POSITIVE + MILESTONE insights only", () => {
    const { service, snap, report } = buildSnapshot();
    const result = service.generate(snap, report);
    const highlights = service.getHighlights(result);
    expect(highlights.every(i =>
      i.type === InsightType.POSITIVE || i.type === InsightType.MILESTONE,
    )).toBe(true);
  });
});
