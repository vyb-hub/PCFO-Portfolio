import { describe, it, expect } from "vitest";
import { FinancialInsightEngine } from "../FinancialInsightEngine";
import { FinancialInsightRegistry } from "../FinancialInsightRegistry";
import { SavingsInsightGenerator } from "../generators/SavingsInsightGenerator";
import { DebtToIncomeInsightGenerator } from "../generators/DebtToIncomeInsightGenerator";
import { EmergencyFundInsightGenerator } from "../generators/EmergencyFundInsightGenerator";
import type { IInsightGenerator } from "../IInsightGenerator";
import type { FinancialInsightGeneratorDefinition } from "../FinancialInsightGeneratorDefinition";
import type { FinancialInsight } from "../FinancialInsight";
import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../../trends/TrendReport";
import { FinancialInsightGeneratorType } from "../FinancialInsightGeneratorType";
import { InsightMetricCategory } from "../InsightMetricCategory";
import { InsightType } from "../InsightType";
import { InsightSeverityLevel } from "../InsightSeverityLevel";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { TrendDirection } from "../../trends/TrendDirection";
import { makeEvaluation, makeSnapshot, makeTrendResult, makeReport, makeThreshold } from "./testHelpers";
import { FINANCIAL_INSIGHT_SNAPSHOT_VERSION } from "../FinancialInsightSnapshot";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function engineWithGenerators(...generators: IInsightGenerator[]) {
  const registry = new FinancialInsightRegistry();
  for (const g of generators) registry.register(g);
  return new FinancialInsightEngine(registry);
}

function makeThrowingGenerator(): IInsightGenerator {
  return {
    definition(): FinancialInsightGeneratorDefinition {
      return {
        id:                FinancialInsightGeneratorType.INVESTMENTS,
        name:              "Throwing Generator",
        description:       "",
        version:           "1.0.0",
        coveredCategories: [],
        coveredMetrics:    [],
      };
    },
    generate(): ReadonlyArray<FinancialInsight> {
      throw new Error("generator exploded");
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FinancialInsightEngine — empty registry", () => {
  it("produces a snapshot with zero insights and an appropriate narrative", () => {
    const engine = engineWithGenerators();
    const snap = makeSnapshot("u1", []);
    const report = makeReport("u1", []);
    const snapshot = engine.generate(snap, report);
    expect(snapshot.insights).toHaveLength(0);
    expect(snapshot.summary.totalInsights).toBe(0);
    expect(snapshot.summary.overallFinancialHealthNarrative).toContain("No financial metrics");
  });

  it("records the snapshot version constant", () => {
    const engine = engineWithGenerators();
    const snap = makeSnapshot("u1", []);
    const report = makeReport("u1", []);
    const snapshot = engine.generate(snap, report);
    expect(snapshot.snapshotVersion).toBe(FINANCIAL_INSIGHT_SNAPSHOT_VERSION);
  });
});

describe("FinancialInsightEngine — generator failure isolation", () => {
  it("captures the failure without aborting other generators", () => {
    const engine = engineWithGenerators(
      new SavingsInsightGenerator(),
      makeThrowingGenerator(),
    );
    const evalObj = makeEvaluation(MetricType.SAVINGS_RATE, 0.25, makeThreshold(0.20, null), true, 0.05);
    const snap = makeSnapshot("u1", [evalObj]);
    const report = makeReport("u1", [makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING)]);
    const snapshot = engine.generate(snap, report);
    expect(snapshot.failures).toHaveLength(1);
    expect(snapshot.failures[0]!.errorMessage).toContain("generator exploded");
    expect(snapshot.insights).toHaveLength(1);  // SavingsInsightGenerator still ran
  });
});

describe("FinancialInsightEngine — sorting", () => {
  it("sorts CRITICAL insights before HIGH, HIGH before MEDIUM, MEDIUM before LOW", () => {
    // SAVINGS_RATE unhealthy + declining → RISK
    // DTI > 50% → CRITICAL RISK
    // EMERGENCY_FUND healthy + improving → POSITIVE
    const engine = engineWithGenerators(
      new SavingsInsightGenerator(),
      new DebtToIncomeInsightGenerator(),
      new EmergencyFundInsightGenerator(),
    );
    const evaluations = [
      // Savings: unhealthy, distance -0.08 → HIGH RISK
      makeEvaluation(MetricType.SAVINGS_RATE, 0.12, makeThreshold(0.20, null), false, -0.08),
      // DTI: 0.55, unhealthy (>50% threshold) → CRITICAL RISK
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.55, makeThreshold(null, 0.43), false, -0.12),
      // Emergency fund: 4.5 months, healthy
      makeEvaluation(MetricType.EMERGENCY_FUND_COVERAGE, 4.5, makeThreshold(3.0, null), true, 1.5, MetricUnit.MONTHS),
    ];
    const snap = makeSnapshot("u1", evaluations);
    const report = makeReport("u1", [
      makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.DECLINING),
      makeTrendResult(MetricType.DEBT_TO_INCOME_RATIO, TrendDirection.DECLINING, 0.8, false),
      makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.IMPROVING, 0.8, true),
    ]);
    const result = engine.generate(snap, report);

    expect(result.insights[0]!.severity).toBe(InsightSeverityLevel.CRITICAL);
    const lastIdx = result.insights.length - 1;
    expect(result.insights[lastIdx]!.severity).toBe(InsightSeverityLevel.LOW);
  });
});

describe("FinancialInsightEngine — summary counts", () => {
  it("counts positives, warnings, risks, and criticals correctly", () => {
    const engine = engineWithGenerators(
      new SavingsInsightGenerator(),
      new DebtToIncomeInsightGenerator(),
    );
    const evaluations = [
      makeEvaluation(MetricType.SAVINGS_RATE, 0.25, makeThreshold(0.20, null), true, 0.05),
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.55, makeThreshold(null, 0.43), false, -0.12),
    ];
    const snap = makeSnapshot("u1", evaluations);
    const report = makeReport("u1", [
      makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING),
      makeTrendResult(MetricType.DEBT_TO_INCOME_RATIO, TrendDirection.DECLINING, 0.8, false),
    ]);
    const result = engine.generate(snap, report);
    expect(result.summary.positiveInsights).toBeGreaterThanOrEqual(1);
    expect(result.summary.criticalIssues).toBeGreaterThanOrEqual(1);
    expect(result.summary.totalInsights).toBe(result.insights.length);
  });
});

describe("FinancialInsightEngine — statistics", () => {
  it("records metricsAnalyzed and metricsWithTrends", () => {
    const engine = engineWithGenerators(new SavingsInsightGenerator());
    const evalObj = makeEvaluation(MetricType.SAVINGS_RATE, 0.25, makeThreshold(0.20, null), true, 0.05);
    const snap = makeSnapshot("u1", [evalObj]);
    const trend = makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING);
    const report = makeReport("u1", [trend]);
    const result = engine.generate(snap, report);
    expect(result.statistics.metricsAnalyzed).toBe(1);
    expect(result.statistics.metricsWithTrends).toBe(1);
    expect(result.statistics.averageConfidence).toBeGreaterThan(0);
  });
});

describe("FinancialInsightEngine — health narrative", () => {
  it("reports 'critical' when critical insights exist", () => {
    const engine = engineWithGenerators(new DebtToIncomeInsightGenerator());
    const evaluations = [
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.60, makeThreshold(null, 0.43), false, -0.17),
    ];
    const snap = makeSnapshot("u1", evaluations);
    const report = makeReport("u1", [makeTrendResult(MetricType.DEBT_TO_INCOME_RATIO, TrendDirection.DECLINING, 0.8, false)]);
    const result = engine.generate(snap, report);
    expect(result.summary.overallFinancialHealthNarrative.toLowerCase()).toContain("critical");
  });

  it("positive narrative when majority are positive", () => {
    const engine = engineWithGenerators(
      new SavingsInsightGenerator(),
      new EmergencyFundInsightGenerator(),
    );
    const evaluations = [
      makeEvaluation(MetricType.SAVINGS_RATE, 0.30, makeThreshold(0.20, null), true, 0.10),
      makeEvaluation(MetricType.EMERGENCY_FUND_COVERAGE, 5.0, makeThreshold(3.0, null), true, 2.0, MetricUnit.MONTHS),
    ];
    const snap = makeSnapshot("u1", evaluations);
    const report = makeReport("u1", [
      makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING),
      makeTrendResult(MetricType.EMERGENCY_FUND_COVERAGE, TrendDirection.IMPROVING, 0.8, true),
    ]);
    const result = engine.generate(snap, report);
    expect(result.summary.positiveInsights).toBeGreaterThanOrEqual(2);
    expect(result.summary.overallFinancialHealthNarrative).toBeTruthy();
  });
});

describe("FinancialInsightEngine — conflicting trends", () => {
  it("produces both a positive savings insight and a critical DTI insight simultaneously", () => {
    const engine = engineWithGenerators(
      new SavingsInsightGenerator(),
      new DebtToIncomeInsightGenerator(),
    );
    const evaluations = [
      makeEvaluation(MetricType.SAVINGS_RATE, 0.28, makeThreshold(0.20, null), true, 0.08),
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.55, makeThreshold(null, 0.43), false, -0.12),
    ];
    const snap = makeSnapshot("u1", evaluations);
    const report = makeReport("u1", [
      makeTrendResult(MetricType.SAVINGS_RATE, TrendDirection.IMPROVING),
      makeTrendResult(MetricType.DEBT_TO_INCOME_RATIO, TrendDirection.DECLINING, 0.8, false),
    ]);
    const result = engine.generate(snap, report);
    const types = result.insights.map(i => i.type);
    expect(types).toContain(InsightType.POSITIVE);
    expect(result.insights.some(i => i.severity === InsightSeverityLevel.CRITICAL)).toBe(true);
    expect(result.insights).toHaveLength(2);
  });
});
