import { describe, it, expect } from "vitest";
import { RiskMitigationRecommendationGenerator } from "../generators/RiskMitigationRecommendationGenerator";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import {
  makeEvaluation,
  makeMetricsSnapshot,
  makeThreshold,
  makeFinding,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "./testHelpers";

const gen = new RiskMitigationRecommendationGenerator();

const emptySnap  = makeMetricsSnapshot("u1", []);
const emptyAnal  = makeAnalyticsSnapshot("u1", []);
const emptyIns   = makeInsightSnapshot("u1", []);

const riskAnal = makeAnalyticsSnapshot("u1", [
  makeFinding("RISK_FINDING", AnalysisFindingType.RISK, MetricType.DEBT_TO_INCOME_RATIO),
]);

describe("RiskMitigationRecommendationGenerator — definition", () => {
  it("returns RISK_MITIGATION generator type", () => {
    expect(gen.definition().id).toBe("RISK_MITIGATION");
  });
});

describe("RiskMitigationRecommendationGenerator — multiple critical insights", () => {
  it("≥ 2 CRITICAL insights → CRITICAL BUILD_EMERGENCY_FUND", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("CRIT_1", InsightMetricCategory.SAVINGS, InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("CRIT_2", InsightMetricCategory.DEBT,    InsightType.RISK, InsightSeverityLevel.CRITICAL),
    ]);
    const recs = gen.generate(emptySnap, riskAnal, snap);
    expect(recs.find(r => r.id === "RISK_MULTIPLE_CRITICAL_EMERGENCY_FUND")).toBeDefined();
    expect(recs.find(r => r.id === "RISK_MULTIPLE_CRITICAL_EMERGENCY_FUND")!.priority).toBe(RecommendationPriority.CRITICAL);
    expect(recs.find(r => r.id === "RISK_MULTIPLE_CRITICAL_EMERGENCY_FUND")!.action).toBe(RecommendationAction.BUILD_EMERGENCY_FUND);
  });

  it("rationale contains the count of critical signals", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("CRIT_A", InsightMetricCategory.SAVINGS,       InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("CRIT_B", InsightMetricCategory.DEBT_TO_INCOME, InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("CRIT_C", InsightMetricCategory.CASH_FLOW,     InsightType.RISK, InsightSeverityLevel.CRITICAL),
    ]);
    const recs = gen.generate(emptySnap, riskAnal, snap);
    expect(recs[0]!.rationale).toContain("3");
  });

  it("exactly 1 CRITICAL → does NOT trigger multi-critical rec", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("CRIT_1", InsightMetricCategory.SAVINGS, InsightType.RISK, InsightSeverityLevel.CRITICAL),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "RISK_MULTIPLE_CRITICAL_EMERGENCY_FUND")).toBeUndefined();
  });
});

describe("RiskMitigationRecommendationGenerator — single risk signal", () => {
  it("1 RISK-type insight → HIGH BUILD_EMERGENCY_FUND", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("RISK_1", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.HIGH),
    ]);
    const recs = gen.generate(emptySnap, riskAnal, snap);
    expect(recs.find(r => r.id === "RISK_THRESHOLD_APPROACHING_EMERGENCY_FUND")).toBeDefined();
    expect(recs.find(r => r.id === "RISK_THRESHOLD_APPROACHING_EMERGENCY_FUND")!.priority).toBe(RecommendationPriority.HIGH);
  });

  it("WARNING-type insight does not count as RISK", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("WARN_1", InsightMetricCategory.SAVINGS, InsightType.WARNING, InsightSeverityLevel.MEDIUM),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs).toHaveLength(0);
  });

  it("no risk insights + no critical → []", () => {
    expect(gen.generate(emptySnap, emptyAnal, emptyIns)).toHaveLength(0);
  });
});

describe("RiskMitigationRecommendationGenerator — supporting insight IDs", () => {
  it("critical rec uses all critical insight IDs as supporting", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("CRIT_X", InsightMetricCategory.SAVINGS, InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("CRIT_Y", InsightMetricCategory.DEBT,    InsightType.RISK, InsightSeverityLevel.CRITICAL),
    ]);
    const recs = gen.generate(emptySnap, riskAnal, snap);
    expect(recs[0]!.supportingInsightIds).toContain("CRIT_X");
    expect(recs[0]!.supportingInsightIds).toContain("CRIT_Y");
  });

  it("risk rec uses RISK-type insight IDs as supporting", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("RISK_Z", InsightMetricCategory.DEBT_TO_INCOME, InsightType.RISK),
    ]);
    const recs = gen.generate(emptySnap, riskAnal, snap);
    expect(recs[0]!.supportingInsightIds).toContain("RISK_Z");
  });
});
