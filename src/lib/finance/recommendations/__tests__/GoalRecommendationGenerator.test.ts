import { describe, it, expect } from "vitest";
import { GoalRecommendationGenerator } from "../generators/GoalRecommendationGenerator";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import {
  makeMetricsSnapshot,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "./testHelpers";

const gen = new GoalRecommendationGenerator();

const emptySnap = makeMetricsSnapshot("u1", []);
const emptyAnal = makeAnalyticsSnapshot("u1", []);
const emptyIns  = makeInsightSnapshot("u1", []);

describe("GoalRecommendationGenerator — definition", () => {
  it("returns GOAL generator type", () => {
    expect(gen.definition().id).toBe("GOAL");
  });
});

describe("GoalRecommendationGenerator — net worth declining", () => {
  it("NET_WORTH + RISK insight → HIGH INCREASE_SAVINGS", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("NW_RISK", InsightMetricCategory.NET_WORTH, InsightType.RISK,
        InsightSeverityLevel.HIGH, 0.80, MetricType.NET_WORTH),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")).toBeDefined();
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")!.priority).toBe(RecommendationPriority.HIGH);
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")!.action).toBe(RecommendationAction.INCREASE_SAVINGS);
  });

  it("NET_WORTH + WARNING insight → HIGH INCREASE_SAVINGS", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("NW_WARN", InsightMetricCategory.NET_WORTH, InsightType.WARNING,
        InsightSeverityLevel.MEDIUM, 0.70, MetricType.NET_WORTH),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")).toBeDefined();
  });

  it("NET_WORTH + POSITIVE insight → no net worth declining rec", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("NW_POS", InsightMetricCategory.NET_WORTH, InsightType.POSITIVE),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")).toBeUndefined();
  });

  it("supportingInsightIds includes net worth insight ID", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("NW_RISK_2", InsightMetricCategory.NET_WORTH, InsightType.RISK,
        InsightSeverityLevel.HIGH, 0.80, MetricType.NET_WORTH),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")!.supportingInsightIds)
      .toContain("NW_RISK_2");
  });
});

describe("GoalRecommendationGenerator — savings velocity", () => {
  it("GOALS + RISK insight (no net worth issue) → MEDIUM INCREASE_SAVINGS", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("GOAL_RISK", InsightMetricCategory.GOALS, InsightType.RISK,
        InsightSeverityLevel.MEDIUM, 0.70, MetricType.SAVINGS_RATE),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_SAVINGS_VELOCITY_IMPROVE")).toBeDefined();
    expect(recs.find(r => r.id === "GOAL_SAVINGS_VELOCITY_IMPROVE")!.priority).toBe(RecommendationPriority.MEDIUM);
  });

  it("GOALS + WARNING insight → MEDIUM INCREASE_SAVINGS", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("GOAL_WARN", InsightMetricCategory.GOALS, InsightType.WARNING),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_SAVINGS_VELOCITY_IMPROVE")).toBeDefined();
  });

  it("net worth declining suppresses velocity rec", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("NW_RISK_3", InsightMetricCategory.NET_WORTH, InsightType.RISK,
        InsightSeverityLevel.HIGH, 0.80, MetricType.NET_WORTH),
      makeInsight("GOAL_RISK_2", InsightMetricCategory.GOALS, InsightType.RISK),
    ]);
    const recs = gen.generate(emptySnap, emptyAnal, snap);
    expect(recs.find(r => r.id === "GOAL_NET_WORTH_DECLINING")).toBeDefined();
    expect(recs.find(r => r.id === "GOAL_SAVINGS_VELOCITY_IMPROVE")).toBeUndefined();
  });
});

describe("GoalRecommendationGenerator — no signals", () => {
  it("empty insight snapshot → []", () => {
    expect(gen.generate(emptySnap, emptyAnal, emptyIns)).toHaveLength(0);
  });
});
