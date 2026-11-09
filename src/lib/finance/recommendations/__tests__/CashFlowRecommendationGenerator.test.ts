import { describe, it, expect } from "vitest";
import { CashFlowRecommendationGenerator } from "../generators/CashFlowRecommendationGenerator";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { TrendDirection } from "../../analytics/TrendDirection";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import {
  makeEvaluation,
  makeMetricsSnapshot,
  makeThreshold,
  makeFinding,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "./testHelpers";

const gen = new CashFlowRecommendationGenerator();

const CF_THRESHOLD = makeThreshold(0, null); // cash flow must be >= 0
const healthy   = makeMetricsSnapshot("u1", [makeEvaluation(MetricType.CASH_FLOW,  500, CF_THRESHOLD, true,  500, MetricUnit.CURRENCY)]);
const unhealthy = makeMetricsSnapshot("u1", [makeEvaluation(MetricType.CASH_FLOW, -200, CF_THRESHOLD, false, -200, MetricUnit.CURRENCY)]);

const emptyAnalytics  = makeAnalyticsSnapshot("u1", []);
const decliningTrend  = makeAnalyticsSnapshot("u1", [
  makeFinding("CF_TREND", AnalysisFindingType.TREND, MetricType.CASH_FLOW, TrendDirection.DECLINING),
]);
const improvingTrend  = makeAnalyticsSnapshot("u1", [
  makeFinding("CF_TREND", AnalysisFindingType.TREND, MetricType.CASH_FLOW, TrendDirection.IMPROVING),
]);

const emptyInsights = makeInsightSnapshot("u1", []);
const cfInsights    = makeInsightSnapshot("u1", [
  makeInsight("CF_RISK", InsightMetricCategory.CASH_FLOW, InsightType.RISK, undefined, 0.85, MetricType.CASH_FLOW),
]);

describe("CashFlowRecommendationGenerator — definition", () => {
  it("returns CASH_FLOW generator type", () => {
    expect(gen.definition().id).toBe("CASH_FLOW");
  });
});

describe("CashFlowRecommendationGenerator — negative cash flow", () => {
  it("unhealthy cash flow → CRITICAL REDUCE_SPENDING", () => {
    const recs = gen.generate(unhealthy, emptyAnalytics, emptyInsights);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.id).toBe("CASH_FLOW_NEGATIVE");
    expect(recs[0]!.priority).toBe(RecommendationPriority.CRITICAL);
    expect(recs[0]!.action).toBe(RecommendationAction.REDUCE_SPENDING);
  });

  it("unhealthy cash flow includes CASH_FLOW supportingMetricTypes", () => {
    const recs = gen.generate(unhealthy, emptyAnalytics, emptyInsights);
    expect(recs[0]!.supportingMetricTypes).toContain(MetricType.CASH_FLOW);
  });

  it("supportingInsightIds populated from CASH_FLOW insights", () => {
    const recs = gen.generate(unhealthy, emptyAnalytics, cfInsights);
    expect(recs[0]!.supportingInsightIds).toContain("CF_RISK");
  });
});

describe("CashFlowRecommendationGenerator — declining trend", () => {
  it("healthy cash flow + DECLINING trend → HIGH CREATE_BUDGET", () => {
    const recs = gen.generate(healthy, decliningTrend, emptyInsights);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.id).toBe("CASH_FLOW_DECLINING_TREND");
    expect(recs[0]!.priority).toBe(RecommendationPriority.HIGH);
    expect(recs[0]!.action).toBe(RecommendationAction.CREATE_BUDGET);
  });

  it("unhealthy cash flow + DECLINING trend → 1 rec (CRITICAL wins, no duplicate budget)", () => {
    const recs = gen.generate(unhealthy, decliningTrend, emptyInsights);
    // cfTrendFinding only fires when cfEval.isHealthy — so only CRITICAL rec here
    expect(recs).toHaveLength(1);
    expect(recs[0]!.id).toBe("CASH_FLOW_NEGATIVE");
  });

  it("healthy cash flow + IMPROVING trend → []", () => {
    const recs = gen.generate(healthy, improvingTrend, emptyInsights);
    expect(recs).toHaveLength(0);
  });

  it("no cash flow eval + declining trend → HIGH rec (no eval treated as healthy)", () => {
    const noEval = makeMetricsSnapshot("u1", []);
    const recs = gen.generate(noEval, decliningTrend, emptyInsights);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.id).toBe("CASH_FLOW_DECLINING_TREND");
  });
});
