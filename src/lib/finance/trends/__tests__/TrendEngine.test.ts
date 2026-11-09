import { describe, it, expect } from "vitest";
import { createDefaultTrendEngine } from "../analyzers/index";
import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { MetricResult } from "../../metrics/MetricResult";
import type { MetricDefinition } from "../../metrics/MetricDefinition";
import type { AggregatePeriod } from "../../aggregation/AggregatePeriod";
import type { SnapshotMetadata } from "../../metrics/snapshot/SnapshotMetadata";
import { MetricType, MetricUnit, CalculationFrequency } from "../../metrics/MetricType";
import { MetricCategory } from "../../metrics/MetricCategory";
import { AggregateGranularity } from "../../aggregation/AggregatePeriod";
import { CURRENT_SNAPSHOT_VERSION } from "../../metrics/snapshot/SnapshotVersion";
import { TrendDirection } from "../TrendDirection";

const SAVINGS_DEF: MetricDefinition = {
  id: MetricType.SAVINGS_RATE,
  name: "Savings Rate",
  description: "",
  category: MetricCategory.SAVINGS,
  unit: MetricUnit.PERCENTAGE,
  version: "1.0",
  calculationFrequency: CalculationFrequency.MONTHLY,
  threshold: { min: 0.2, max: null, optimal: 0.3, description: "" },
};

const DTI_DEF: MetricDefinition = {
  id: MetricType.DEBT_TO_INCOME_RATIO,
  name: "DTI",
  description: "",
  category: MetricCategory.DEBT,
  unit: MetricUnit.RATIO,
  version: "1.0",
  calculationFrequency: CalculationFrequency.MONTHLY,
  threshold: { min: null, max: 0.43, optimal: null, description: "" },
};

function period(label: string, month: number): AggregatePeriod {
  const start = new Date(2026, month - 1, 1);
  const end = new Date(2026, month, 0);
  return { range: { start, end }, label, granularity: AggregateGranularity.MONTHLY };
}

function metadata(userId: string): SnapshotMetadata {
  const now = new Date();
  return {
    userId,
    generatedAt: now,
    aggregatedAt: now,
    version: CURRENT_SNAPSHOT_VERSION,
    totalAttempted: 1,
    successfulMetrics: 1,
    failedMetrics: 0,
  };
}

function snapshot(
  userId: string,
  label: string,
  month: number,
  metrics: Array<{ def: MetricDefinition; value: number }>,
): FinancialMetricsSnapshot {
  const p = period(label, month);
  const results: MetricResult[] = metrics.map(({ def, value }) => ({
    type: def.id,
    value,
    unit: def.unit,
    period: p,
    calculatedAt: new Date(),
    definition: def,
  }));
  return {
    userId,
    period: p,
    metadata: metadata(userId),
    results,
    evaluations: [],
    failures: [],
    definitions: results.map((r) => r.definition),
  };
}

function savingsSnapshot(userId: string, label: string, month: number, value: number) {
  return snapshot(userId, label, month, [{ def: SAVINGS_DEF, value }]);
}

describe("TrendEngine", () => {
  const engine = createDefaultTrendEngine();

  it("throws on empty snapshots array", () => {
    expect(() => engine.analyze([])).toThrow();
  });

  it("single snapshot → no trends (need ≥2)", () => {
    const report = engine.analyze([savingsSnapshot("u1", "2026-01", 1, 0.20)]);
    expect(report.trends).toHaveLength(0);
    expect(report.metadata.snapshotsAnalyzed).toBe(1);
  });

  it("detects improving savings rate across 5 months", () => {
    const snapshots = [
      savingsSnapshot("u1", "2026-01", 1, 0.10),
      savingsSnapshot("u1", "2026-02", 2, 0.15),
      savingsSnapshot("u1", "2026-03", 3, 0.20),
      savingsSnapshot("u1", "2026-04", 4, 0.25),
      savingsSnapshot("u1", "2026-05", 5, 0.30),
    ];
    const report = engine.analyze(snapshots);
    expect(report.trends).toHaveLength(1);
    const trend = report.trends[0]!;
    expect(trend.metricType).toBe(MetricType.SAVINGS_RATE);
    expect(trend.direction).toBe(TrendDirection.IMPROVING);
    expect(report.userId).toBe("u1");
  });

  it("sorts snapshots chronologically regardless of input order", () => {
    const snapshots = [
      savingsSnapshot("u1", "2026-05", 5, 0.30),
      savingsSnapshot("u1", "2026-01", 1, 0.10),
      savingsSnapshot("u1", "2026-03", 3, 0.20),
      savingsSnapshot("u1", "2026-02", 2, 0.15),
      savingsSnapshot("u1", "2026-04", 4, 0.25),
    ];
    const report = engine.analyze(snapshots);
    expect(report.trends[0]!.direction).toBe(TrendDirection.IMPROVING);
  });

  it("throws on mixed userIds", () => {
    const snapshots = [
      savingsSnapshot("user1", "2026-01", 1, 0.10),
      savingsSnapshot("user2", "2026-02", 2, 0.20),
    ];
    expect(() => engine.analyze(snapshots)).toThrow(/mixed userId/);
  });

  it("populates TrendPeriod with first and last period labels", () => {
    const snapshots = [
      savingsSnapshot("u1", "2026-01", 1, 0.10),
      savingsSnapshot("u1", "2026-02", 2, 0.15),
      savingsSnapshot("u1", "2026-03", 3, 0.20),
    ];
    const report = engine.analyze(snapshots);
    expect(report.analyzedPeriod.firstPeriodLabel).toBe("2026-01");
    expect(report.analyzedPeriod.lastPeriodLabel).toBe("2026-03");
    expect(report.analyzedPeriod.periodsAnalyzed).toBe(3);
  });

  it("handles multiple metrics in the same snapshot set", () => {
    const snapshots = [
      snapshot("u1", "2026-01", 1, [
        { def: SAVINGS_DEF, value: 0.10 },
        { def: DTI_DEF, value: 0.40 },
      ]),
      snapshot("u1", "2026-02", 2, [
        { def: SAVINGS_DEF, value: 0.15 },
        { def: DTI_DEF, value: 0.35 },
      ]),
      snapshot("u1", "2026-03", 3, [
        { def: SAVINGS_DEF, value: 0.20 },
        { def: DTI_DEF, value: 0.30 },
      ]),
    ];
    const report = engine.analyze(snapshots);
    expect(report.trends).toHaveLength(2);
    const savingsTrend = report.trends.find(
      (t) => t.metricType === MetricType.SAVINGS_RATE,
    );
    const dtiTrend = report.trends.find(
      (t) => t.metricType === MetricType.DEBT_TO_INCOME_RATIO,
    );
    expect(savingsTrend?.direction).toBe(TrendDirection.IMPROVING);
    expect(dtiTrend?.direction).toBe(TrendDirection.IMPROVING);  // falling DTI = improving
  });

  it("metric missing from some snapshots still analyzed from available ones", () => {
    const snapshots = [
      savingsSnapshot("u1", "2026-01", 1, 0.10),
      // DTI appears only in snapshot 2 and 3 — still ≥2 points
      snapshot("u1", "2026-02", 2, [
        { def: SAVINGS_DEF, value: 0.15 },
        { def: DTI_DEF, value: 0.40 },
      ]),
      snapshot("u1", "2026-03", 3, [
        { def: SAVINGS_DEF, value: 0.20 },
        { def: DTI_DEF, value: 0.35 },
      ]),
    ];
    const report = engine.analyze(snapshots);
    expect(report.trends.some((t) => t.metricType === MetricType.DEBT_TO_INCOME_RATIO)).toBe(true);
  });

  it("metadata.coversPeriodLabels lists all sorted period labels", () => {
    const snapshots = [
      savingsSnapshot("u1", "2026-03", 3, 0.20),
      savingsSnapshot("u1", "2026-01", 1, 0.10),
      savingsSnapshot("u1", "2026-02", 2, 0.15),
    ];
    const report = engine.analyze(snapshots);
    expect(report.metadata.coversPeriodLabels).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("performance: 100 snapshots analyzed in < 500ms", () => {
    const snapshots = Array.from({ length: 100 }, (_, i) =>
      savingsSnapshot("u1", `2026-${String(i + 1).padStart(3, "0")}`, (i % 12) + 1, 0.10 + i * 0.001),
    );
    const start = performance.now();
    engine.analyze(snapshots);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
