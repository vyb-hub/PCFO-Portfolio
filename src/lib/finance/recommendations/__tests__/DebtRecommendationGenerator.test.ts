import { describe, it, expect } from "vitest";
import { DebtRecommendationGenerator } from "../generators/DebtRecommendationGenerator";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import {
  makeEvaluation,
  makeMetricsSnapshot,
  makeThreshold,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "./testHelpers";

const gen = new DebtRecommendationGenerator();

const DTI_MAX    = makeThreshold(null, 0.43);
const CU_MAX     = makeThreshold(null, 0.30);
const emptyAnal  = makeAnalyticsSnapshot("u1", []);
const emptyIns   = makeInsightSnapshot("u1", []);

const dtiInsights = makeInsightSnapshot("u1", [
  makeInsight("DTI_RISK",    InsightMetricCategory.DEBT_TO_INCOME, InsightType.RISK),
  makeInsight("DEBT_RISK",   InsightMetricCategory.DEBT,           InsightType.RISK),
]);

describe("DebtRecommendationGenerator — definition", () => {
  it("returns DEBT generator type", () => {
    expect(gen.definition().id).toBe("DEBT");
  });
});

describe("DebtRecommendationGenerator — DTI exceeded", () => {
  it("DTI > max → CRITICAL ACCELERATE_DEBT_REPAYMENT", () => {
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.50, DTI_MAX, false, -0.07, MetricUnit.RATIO),
    ]);
    const recs = gen.generate(snap, emptyAnal, emptyIns);
    expect(recs.find(r => r.id === "DEBT_DTI_EXCEEDED")).toBeDefined();
    expect(recs.find(r => r.id === "DEBT_DTI_EXCEEDED")!.priority).toBe(RecommendationPriority.CRITICAL);
    expect(recs.find(r => r.id === "DEBT_DTI_EXCEEDED")!.action).toBe(RecommendationAction.ACCELERATE_DEBT_REPAYMENT);
  });

  it("rationale includes the actual DTI percentage", () => {
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.50, DTI_MAX, false, -0.07, MetricUnit.RATIO),
    ]);
    const recs = gen.generate(snap, emptyAnal, emptyIns);
    expect(recs[0]!.rationale).toContain("50.0%");
  });

  it("supportingInsightIds from DEBT and DEBT_TO_INCOME categories", () => {
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.50, DTI_MAX, false, -0.07, MetricUnit.RATIO),
    ]);
    const recs = gen.generate(snap, emptyAnal, dtiInsights);
    expect(recs[0]!.supportingInsightIds).toContain("DTI_RISK");
    expect(recs[0]!.supportingInsightIds).toContain("DEBT_RISK");
  });
});

describe("DebtRecommendationGenerator — DTI approaching", () => {
  it("DTI within 15% of max → HIGH (approaching) — no CRITICAL", () => {
    // 0.40 / 0.43 = 0.93 > 0.85 threshold
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.40, DTI_MAX, true, 0.03, MetricUnit.RATIO),
    ]);
    const recs = gen.generate(snap, emptyAnal, emptyIns);
    expect(recs.find(r => r.id === "DEBT_DTI_APPROACHING")).toBeDefined();
    expect(recs.find(r => r.id === "DEBT_DTI_APPROACHING")!.priority).toBe(RecommendationPriority.HIGH);
    expect(recs.find(r => r.id === "DEBT_DTI_EXCEEDED")).toBeUndefined();
  });

  it("DTI well below max → no DTI recommendations", () => {
    // 0.20 / 0.43 = 0.47 < 0.85
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.20, DTI_MAX, true, 0.23, MetricUnit.RATIO),
    ]);
    const recs = gen.generate(snap, emptyAnal, emptyIns);
    expect(recs.find(r => r.id.startsWith("DEBT_DTI"))).toBeUndefined();
  });
});

describe("DebtRecommendationGenerator — credit utilisation", () => {
  it("credit util > max → HIGH ACCELERATE_DEBT_REPAYMENT", () => {
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.CREDIT_UTILIZATION, 0.45, CU_MAX, false, -0.15, MetricUnit.RATIO),
    ]);
    const recs = gen.generate(snap, emptyAnal, emptyIns);
    expect(recs.find(r => r.id === "DEBT_CREDIT_UTIL_HIGH")).toBeDefined();
    expect(recs.find(r => r.id === "DEBT_CREDIT_UTIL_HIGH")!.priority).toBe(RecommendationPriority.HIGH);
  });

  it("healthy credit util → no credit rec", () => {
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.CREDIT_UTILIZATION, 0.10, CU_MAX, true, 0.20, MetricUnit.RATIO),
    ]);
    expect(gen.generate(snap, emptyAnal, emptyIns)).toHaveLength(0);
  });

  it("no evals → []", () => {
    expect(gen.generate(makeMetricsSnapshot("u1", []), emptyAnal, emptyIns)).toHaveLength(0);
  });
});
