import { describe, it, expect } from "vitest";
import { DefaultMetricTrendAnalyzer } from "../analyzers/DefaultMetricTrendAnalyzer";
import { TrendDirection } from "../TrendDirection";
import { TrendStrength } from "../TrendStrength";
import type { TrendDataPoint } from "../TrendDataPoint";
import type { MetricDefinition } from "../../metrics/MetricDefinition";
import { MetricType, MetricUnit, CalculationFrequency } from "../../metrics/MetricType";
import { MetricCategory } from "../../metrics/MetricCategory";

function savingsDef(): MetricDefinition {
  return {
    id: MetricType.SAVINGS_RATE,
    name: "Savings Rate",
    description: "",
    category: MetricCategory.SAVINGS,
    unit: MetricUnit.PERCENTAGE,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: { min: 0.2, max: null, optimal: 0.3, description: "Save at least 20%" },
  };
}

function dtiDef(): MetricDefinition {
  return {
    id: MetricType.DEBT_TO_INCOME_RATIO,
    name: "DTI",
    description: "",
    category: MetricCategory.DEBT,
    unit: MetricUnit.RATIO,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: { min: null, max: 0.43, optimal: null, description: "Keep DTI below 43%" },
  };
}

function cashFlowDef(): MetricDefinition {
  return {
    id: MetricType.CASH_FLOW,
    name: "Cash Flow",
    description: "",
    category: MetricCategory.CASH_FLOW,
    unit: MetricUnit.CURRENCY,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: { min: 0, max: null, optimal: null, description: "Positive cash flow" },
  };
}

function makePoints(
  values: number[],
  def: MetricDefinition,
  type: MetricType = MetricType.SAVINGS_RATE,
): ReadonlyArray<TrendDataPoint> {
  return values.map((value, i) => ({
    period: `2026-${String(i + 1).padStart(2, "0")}`,
    value,
    metricType: type,
    unit: MetricUnit.PERCENTAGE,
    definition: def,
  }));
}

describe("DefaultMetricTrendAnalyzer", () => {
  const analyzer = new DefaultMetricTrendAnalyzer();

  it("improving: steadily rising savings rate", () => {
    const r = analyzer.analyze(makePoints([0.10, 0.15, 0.20, 0.25, 0.30], savingsDef()));
    expect(r.direction).toBe(TrendDirection.IMPROVING);
    expect(r.strength).not.toBe(TrendStrength.NONE);
    expect(r.isHigherBetter).toBe(true);
    expect(r.stats.absoluteChange).toBeCloseTo(0.20);
    expect(r.stats.percentageChange).toBeCloseTo(200);
  });

  it("declining: falling savings rate", () => {
    const r = analyzer.analyze(makePoints([0.30, 0.25, 0.20, 0.15, 0.10], savingsDef()));
    expect(r.direction).toBe(TrendDirection.DECLINING);
    expect(r.stats.absoluteChange).toBeCloseTo(-0.20);
  });

  it("stable: < 2% normalised slope change", () => {
    const r = analyzer.analyze(makePoints([0.25, 0.251, 0.252, 0.251, 0.252], savingsDef()));
    expect(r.direction).toBe(TrendDirection.STABLE);
    expect(r.strength).toBe(TrendStrength.NONE);
  });

  it("volatile: high coefficient of variation", () => {
    const r = analyzer.analyze(makePoints([0.10, 0.80, 0.05, 0.90, 0.08], savingsDef()));
    expect(r.direction).toBe(TrendDirection.VOLATILE);
    expect(r.strength).toBe(TrendStrength.NONE);
  });

  it("insufficient data: single point", () => {
    const r = analyzer.analyze(makePoints([0.25], savingsDef()));
    expect(r.direction).toBe(TrendDirection.INSUFFICIENT_DATA);
    expect(r.strength).toBe(TrendStrength.NONE);
    expect(r.periodsAnalyzed).toBe(1);
  });

  it("throws on empty data points", () => {
    expect(() => analyzer.analyze([])).toThrow();
  });

  it("DTI rising → DECLINING (lower-is-better metric)", () => {
    const r = analyzer.analyze(
      makePoints([0.20, 0.25, 0.30, 0.35, 0.40], dtiDef(), MetricType.DEBT_TO_INCOME_RATIO),
    );
    expect(r.direction).toBe(TrendDirection.DECLINING);
    expect(r.isHigherBetter).toBe(false);
  });

  it("DTI falling → IMPROVING (lower-is-better metric)", () => {
    const r = analyzer.analyze(
      makePoints([0.40, 0.35, 0.30, 0.25, 0.20], dtiDef(), MetricType.DEBT_TO_INCOME_RATIO),
    );
    expect(r.direction).toBe(TrendDirection.IMPROVING);
  });

  it("negative cash flow improving toward zero", () => {
    // Cash flow going from -500 to -100: absoluteChange = +400, direction = IMPROVING
    const r = analyzer.analyze(
      makePoints([-500, -400, -300, -200, -100], cashFlowDef(), MetricType.CASH_FLOW),
    );
    expect(r.direction).toBe(TrendDirection.IMPROVING);
    expect(r.stats.absoluteChange).toBeCloseTo(400);
  });

  it("negative cash flow worsening", () => {
    const r = analyzer.analyze(
      makePoints([-100, -200, -300, -400, -500], cashFlowDef(), MetricType.CASH_FLOW),
    );
    expect(r.direction).toBe(TrendDirection.DECLINING);
  });

  it("large history: 12 periods → high confidence", () => {
    const values = Array.from({ length: 12 }, (_, i) => 0.10 + i * 0.02);
    const r = analyzer.analyze(makePoints(values, savingsDef()));
    expect(r.direction).toBe(TrendDirection.IMPROVING);
    expect(r.periodsAnalyzed).toBe(12);
    expect(r.stats.confidence).toBeGreaterThan(0.8);
  });

  it("outlier spike: single anomalous value — still returns a valid result", () => {
    const r = analyzer.analyze(makePoints([0.25, 0.26, 0.80, 0.25, 0.24], savingsDef()));
    expect(r.direction).toBeDefined();
    expect(r.stats.standardDeviation).toBeGreaterThan(0);
  });

  it("consistency = 1 for monotonically increasing series", () => {
    const r = analyzer.analyze(makePoints([1, 2, 3, 4, 5], savingsDef()));
    expect(r.stats.consistency).toBeCloseTo(1);
  });

  it("consistency < 1 for alternating series (3 of 5 steps aligned = 0.6)", () => {
    // [1,3,1,3,1,3]: overall UP (1→3); steps: up✓, down✗, up✓, down✗, up✓ → 3/5 = 0.60
    const r = analyzer.analyze(makePoints([1, 3, 1, 3, 1, 3], savingsDef()));
    expect(r.stats.consistency).toBeLessThan(1);
    expect(r.stats.consistency).toBeGreaterThan(0);
  });

  it("rolling average = arithmetic mean", () => {
    const r = analyzer.analyze(makePoints([10, 20, 30], savingsDef()));
    expect(r.stats.rollingAverage).toBeCloseTo(20);
  });

  it("velocity = absoluteChange / (n − 1)", () => {
    const r = analyzer.analyze(makePoints([10, 20, 30, 40, 50], savingsDef()));
    expect(r.stats.velocity).toBeCloseTo(10);  // 40 / 4
  });

  it("performance: 100 data points < 100ms", () => {
    const values = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.001);
    const start = performance.now();
    analyzer.analyze(makePoints(values, savingsDef()));
    expect(performance.now() - start).toBeLessThan(100);
  });
});
