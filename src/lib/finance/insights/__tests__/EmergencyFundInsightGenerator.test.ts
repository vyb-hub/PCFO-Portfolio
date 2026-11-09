import { describe, it, expect } from "vitest";
import { EmergencyFundInsightGenerator } from "../generators/EmergencyFundInsightGenerator";
import { TrendDirection } from "../../trends/TrendDirection";
import { InsightType } from "../InsightType";
import { InsightSeverityLevel } from "../InsightSeverityLevel";
import { InsightMetricCategory } from "../InsightMetricCategory";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { makeEvaluation, makeSnapshot, makeTrendResult, makeReport, makeThreshold } from "./testHelpers";

const generator = new EmergencyFundInsightGenerator();
const THRESHOLD = makeThreshold(3.0, null);

function snap(value: number, isHealthy: boolean, distance: number) {
  return makeSnapshot("u1", [
    makeEvaluation(MetricType.EMERGENCY_FUND_COVERAGE, value, THRESHOLD, isHealthy, distance, MetricUnit.MONTHS),
  ]);
}

describe("EmergencyFundInsightGenerator — definition", () => {
  it("covers EMERGENCY_FUND category and EMERGENCY_FUND_COVERAGE metric", () => {
    const def = generator.definition();
    expect(def.coveredCategories).toContain(InsightMetricCategory.EMERGENCY_FUND);
    expect(def.coveredMetrics).toContain(MetricType.EMERGENCY_FUND_COVERAGE);
  });
});

describe("EmergencyFundInsightGenerator — milestone", () => {
  it("≥ 6 months and healthy → MILESTONE at LOW severity", () => {
    const s = snap(6.5, true, 3.5);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.STABLE, 0.8, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.MILESTONE);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
    expect(insight.summary).toContain("6.5 months");
  });
});

describe("EmergencyFundInsightGenerator — healthy range (3–5.9 months)", () => {
  it("IMPROVING trend → POSITIVE at LOW", () => {
    const s = snap(4.5, true, 1.5);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.IMPROVING, 0.8, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.POSITIVE);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
  });

  it("DECLINING trend → WARNING at MEDIUM", () => {
    const s = snap(3.2, true, 0.2);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.DECLINING, 0.7, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.WARNING);
    expect(insight.severity).toBe(InsightSeverityLevel.MEDIUM);
  });

  it("STABLE trend → NEUTRAL at LOW", () => {
    const s = snap(3.5, true, 0.5);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.STABLE, 0.8, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.NEUTRAL);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
  });
});

describe("EmergencyFundInsightGenerator — unhealthy range", () => {
  it("1–2.9 months (below min) + IMPROVING → OPPORTUNITY at MEDIUM", () => {
    const s = snap(2.0, false, -1.0);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.IMPROVING, 0.7, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.OPPORTUNITY);
    expect(insight.severity).toBe(InsightSeverityLevel.MEDIUM);
  });

  it("1–2.9 months + DECLINING → RISK at MEDIUM", () => {
    const s = snap(2.5, false, -0.5);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.DECLINING, 0.7, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.RISK);
    expect(insight.severity).toBe(InsightSeverityLevel.MEDIUM);
  });

  it("0.5–0.9 months (dangerously thin) + DECLINING → RISK at HIGH", () => {
    const s = snap(0.8, false, -2.2);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.DECLINING, 0.7, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.RISK);
    expect(insight.severity).toBe(InsightSeverityLevel.HIGH);
    expect(insight.title).toContain("Dangerously Thin");
  });

  it("< 0.5 months (critical) + any trend → RISK at CRITICAL", () => {
    const s = snap(0.2, false, -2.8);
    const report = makeReport("u1", [makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.STABLE, 0.6, true)]);
    const insight = generator.generate(s, report)[0]!;
    expect(insight.type).toBe(InsightType.RISK);
    expect(insight.severity).toBe(InsightSeverityLevel.CRITICAL);
    expect(insight.title).toContain("Critically Low");
  });
});
