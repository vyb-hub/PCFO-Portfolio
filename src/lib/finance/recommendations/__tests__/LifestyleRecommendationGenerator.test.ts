import { describe, it, expect } from "vitest";
import { LifestyleRecommendationGenerator } from "../generators/LifestyleRecommendationGenerator";
import { MetricType } from "../../metrics/MetricType";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import {
  makeMetricsSnapshot,
  makeFinding,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "./testHelpers";

const gen = new LifestyleRecommendationGenerator();

const emptySnap = makeMetricsSnapshot("u1", []);
const emptyAnal = makeAnalyticsSnapshot("u1", []);
const emptyIns  = makeInsightSnapshot("u1", []);

const seasonalityAnal = makeAnalyticsSnapshot("u1", [
  makeFinding("SEASONAL_Q1", AnalysisFindingType.SEASONALITY, MetricType.BURN_RATE),
]);

describe("LifestyleRecommendationGenerator — definition", () => {
  it("returns LIFESTYLE generator type", () => {
    expect(gen.definition().id).toBe("LIFESTYLE");
  });
});

describe("LifestyleRecommendationGenerator — recurring spend creep", () => {
  it("SPENDING + WARNING insight → MEDIUM REDUCE_RECURRING_COSTS", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SPEND_WARN", InsightMetricCategory.SPENDING, InsightType.WARNING,
        InsightSeverityLevel.MEDIUM, 0.80),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")).toBeDefined();
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")!.priority)
      .toBe(RecommendationPriority.MEDIUM);
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")!.action)
      .toBe(RecommendationAction.REDUCE_RECURRING_COSTS);
  });

  it("SPENDING + RISK insight → MEDIUM REDUCE_RECURRING_COSTS", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SPEND_RISK", InsightMetricCategory.SPENDING, InsightType.RISK,
        InsightSeverityLevel.HIGH, 0.75),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")).toBeDefined();
  });

  it("confidence >= 0.70 → RecommendationConfidence.HIGH", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SPEND_HIGH_CONF", InsightMetricCategory.SPENDING, InsightType.WARNING,
        InsightSeverityLevel.MEDIUM, 0.85),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")!.confidence)
      .toBe(RecommendationConfidence.HIGH);
  });

  it("confidence < 0.70 → RecommendationConfidence.MEDIUM", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SPEND_LOW_CONF", InsightMetricCategory.SPENDING, InsightType.WARNING,
        InsightSeverityLevel.MEDIUM, 0.60),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")!.confidence)
      .toBe(RecommendationConfidence.MEDIUM);
  });

  it("non-SPENDING insight does not trigger creep rec", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SAVINGS_WARN", InsightMetricCategory.SAVINGS, InsightType.WARNING),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "LIFESTYLE_RECURRING_SPEND_CREEP")).toBeUndefined();
  });
});

describe("LifestyleRecommendationGenerator — seasonality", () => {
  it("SEASONALITY finding → LOW CREATE_BUDGET", () => {
    const recs = gen.generate(emptySnap, seasonalityAnal, emptyIns);
    expect(recs.find(r => r.id === "LIFESTYLE_SEASONAL_BUDGET_PLAN")).toBeDefined();
    expect(recs.find(r => r.id === "LIFESTYLE_SEASONAL_BUDGET_PLAN")!.priority)
      .toBe(RecommendationPriority.LOW);
    expect(recs.find(r => r.id === "LIFESTYLE_SEASONAL_BUDGET_PLAN")!.action)
      .toBe(RecommendationAction.CREATE_BUDGET);
    expect(recs.find(r => r.id === "LIFESTYLE_SEASONAL_BUDGET_PLAN")!.confidence)
      .toBe(RecommendationConfidence.LOW);
  });

  it("no seasonality findings → no seasonal rec", () => {
    const recs = gen.generate(emptySnap, emptyAnal, emptyIns);
    expect(recs.find(r => r.id === "LIFESTYLE_SEASONAL_BUDGET_PLAN")).toBeUndefined();
  });

  it("supportingFindingIds includes seasonality finding ID", () => {
    const recs = gen.generate(emptySnap, seasonalityAnal, emptyIns);
    expect(recs.find(r => r.id === "LIFESTYLE_SEASONAL_BUDGET_PLAN")!.supportingFindingIds)
      .toContain("SEASONAL_Q1");
  });
});

describe("LifestyleRecommendationGenerator — combined + empty", () => {
  it("creep insight + seasonality finding → 2 recs", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SPEND_WARN2", InsightMetricCategory.SPENDING, InsightType.WARNING),
    ]);
    const recs = gen.generate(emptySnap, seasonalityAnal, snap);
    expect(recs).toHaveLength(2);
  });

  it("empty insight snapshot + no seasonality → []", () => {
    expect(gen.generate(emptySnap, emptyAnal, emptyIns)).toHaveLength(0);
  });
});
