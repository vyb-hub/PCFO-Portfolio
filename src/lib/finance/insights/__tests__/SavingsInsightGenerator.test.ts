import { describe, it, expect } from "vitest";
import { SavingsInsightGenerator } from "../generators/SavingsInsightGenerator";
import { TrendDirection } from "../../trends/TrendDirection";
import { InsightType } from "../InsightType";
import { InsightSeverityLevel } from "../InsightSeverityLevel";
import { InsightMetricCategory } from "../InsightMetricCategory";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { makeEvaluation, makeSnapshot, makeTrendResult, makeReport, makeThreshold } from "./testHelpers";

const generator = new SavingsInsightGenerator();

const THRESHOLD = makeThreshold(0.20, null);

function snapshot(value: number, isHealthy: boolean, distance: number) {
  return makeSnapshot("u1", [
    makeEvaluation(MetricType.SAVINGS_RATE, value, THRESHOLD, isHealthy, distance),
  ]);
}

describe("SavingsInsightGenerator — definition", () => {
  it("covers the SAVINGS category and SAVINGS_RATE metric", () => {
    const def = generator.definition();
    expect(def.coveredCategories).toContain(InsightMetricCategory.SAVINGS);
    expect(def.coveredMetrics).toContain(MetricType.SAVINGS_RATE);
  });
});

describe("SavingsInsightGenerator — no metric data", () => {
  it("returns [] when SAVINGS_RATE is absent from snapshot", () => {
    const snap = makeSnapshot("u1", []);
    const report = makeReport("u1", []);
    expect(generator.generate(snap, report)).toHaveLength(0);
  });
});

describe("SavingsInsightGenerator — healthy metric", () => {
  const snap = snapshot(0.25, true, 0.05);

  it("IMPROVING trend → POSITIVE insight", () => {
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.POSITIVE);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
    expect(insight.category).toBe(InsightMetricCategory.SAVINGS);
  });

  it("STABLE trend → NEUTRAL insight", () => {
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.STABLE)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.NEUTRAL);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
  });

  it("DECLINING trend → WARNING insight at MEDIUM severity", () => {
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.DECLINING)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.WARNING);
    expect(insight.severity).toBe(InsightSeverityLevel.MEDIUM);
  });

  it("VOLATILE trend → WARNING insight at LOW severity", () => {
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.VOLATILE)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.WARNING);
    expect(insight.severity).toBe(InsightSeverityLevel.LOW);
  });

  it("INSUFFICIENT_DATA trend → NEUTRAL insight", () => {
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.INSUFFICIENT_DATA)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.NEUTRAL);
  });

  it("no trend in report → NEUTRAL insight (confidence 0.50)", () => {
    const report = makeReport("u1", []);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.NEUTRAL);
    expect(insight.confidence).toBe(0.50);
  });
});

describe("SavingsInsightGenerator — unhealthy metric", () => {
  it("IMPROVING trend → OPPORTUNITY at MEDIUM severity", () => {
    // value=0.14, distance=-0.06 from min=0.20 → MEDIUM severity → overridden to MEDIUM in OPPORTUNITY branch
    const snap = snapshot(0.14, false, -0.06);
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.OPPORTUNITY);
    expect(insight.severity).toBe(InsightSeverityLevel.MEDIUM);
  });

  it("DECLINING trend → RISK at HIGH severity", () => {
    // value=0.12, distance=-0.08 from min=0.20 → normalised=0.40 → HIGH
    const snap = snapshot(0.12, false, -0.08);
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.DECLINING)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.RISK);
    expect(insight.severity).toBe(InsightSeverityLevel.HIGH);
  });

  it("STABLE trend → RISK", () => {
    const snap = snapshot(0.10, false, -0.10);
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.STABLE)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.RISK);
  });

  it("CRITICAL distance → RISK at CRITICAL severity", () => {
    // value=0.05, distance=-0.15, normalised=0.75 → CRITICAL
    const snap = snapshot(0.05, false, -0.15);
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.STABLE)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.type).toBe(InsightType.RISK);
    expect(insight.severity).toBe(InsightSeverityLevel.CRITICAL);
  });

  it("insight summary contains formatted percentage value", () => {
    const snap = snapshot(0.18, false, -0.02);
    const report = makeReport("u1", []);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.summary).toContain("18.0%");
  });

  it("confidence for INSUFFICIENT_DATA trend is 0.30", () => {
    const snap = snapshot(0.18, false, -0.02);
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.INSUFFICIENT_DATA)]);
    const insight = generator.generate(snap, report)[0]!;
    expect(insight.confidence).toBe(0.30);
  });
});

describe("SavingsInsightGenerator — always produces exactly one insight", () => {
  const cases: [string, boolean, TrendDirection][] = [
    ["healthy + IMPROVING",          true,  TrendDirection.IMPROVING],
    ["healthy + DECLINING",          true,  TrendDirection.DECLINING],
    ["healthy + STABLE",             true,  TrendDirection.STABLE],
    ["healthy + VOLATILE",           true,  TrendDirection.VOLATILE],
    ["healthy + INSUFFICIENT_DATA",  true,  TrendDirection.INSUFFICIENT_DATA],
    ["unhealthy + IMPROVING",        false, TrendDirection.IMPROVING],
    ["unhealthy + DECLINING",        false, TrendDirection.DECLINING],
    ["unhealthy + STABLE",           false, TrendDirection.STABLE],
  ];

  for (const [label, isHealthy, direction] of cases) {
    it(`${label} → exactly 1 insight`, () => {
      const snap = snapshot(isHealthy ? 0.25 : 0.12, isHealthy, isHealthy ? 0.05 : -0.08);
      const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, direction)]);
      expect(generator.generate(snap, report)).toHaveLength(1);
    });
  }
});
