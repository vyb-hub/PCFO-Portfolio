import { describe, it, expect } from "vitest";
import { InvestmentRecommendationGenerator } from "../generators/InvestmentRecommendationGenerator";
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

const gen = new InvestmentRecommendationGenerator();

const CF_THRESHOLD = makeThreshold(0,    null);
const SR_THRESHOLD = makeThreshold(0.10, null);

const healthySnap = makeMetricsSnapshot("u1", [
  makeEvaluation(MetricType.CASH_FLOW,   500, CF_THRESHOLD, true,  500, MetricUnit.CURRENCY),
  makeEvaluation(MetricType.SAVINGS_RATE, 0.25, SR_THRESHOLD, true, 0.15),
]);
const unhealthyCfSnap = makeMetricsSnapshot("u1", [
  makeEvaluation(MetricType.CASH_FLOW,   -100, CF_THRESHOLD, false, -100, MetricUnit.CURRENCY),
  makeEvaluation(MetricType.SAVINGS_RATE, 0.25, SR_THRESHOLD, true,  0.15),
]);
const unhealthySrSnap = makeMetricsSnapshot("u1", [
  makeEvaluation(MetricType.CASH_FLOW,    500, CF_THRESHOLD, true,  500, MetricUnit.CURRENCY),
  makeEvaluation(MetricType.SAVINGS_RATE, 0.05, SR_THRESHOLD, false, -0.05),
]);

const emptyAnal   = makeAnalyticsSnapshot("u1", []);
const emptyIns    = makeInsightSnapshot("u1", []);
const oppInsights = makeInsightSnapshot("u1", [
  makeInsight("OPP_1", InsightMetricCategory.SAVINGS,    InsightType.OPPORTUNITY),
  makeInsight("OPP_2", InsightMetricCategory.INVESTMENTS, InsightType.OPPORTUNITY),
]);

describe("InvestmentRecommendationGenerator — definition", () => {
  it("returns INVESTMENT generator type", () => {
    expect(gen.definition().id).toBe("INVESTMENT");
  });
});

describe("InvestmentRecommendationGenerator — multi-signal opportunity", () => {
  it("OPPORTUNITY insights + healthy cf + healthy sr → LOW INCREASE_INVESTMENT", () => {
    const recs = gen.generate(healthySnap, emptyAnal, oppInsights);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.id).toBe("INVESTMENT_OPPORTUNITY_MULTI_SIGNAL");
    expect(recs[0]!.priority).toBe(RecommendationPriority.LOW);
    expect(recs[0]!.action).toBe(RecommendationAction.INCREASE_INVESTMENT);
  });

  it("supportingInsightIds includes all OPPORTUNITY insight IDs", () => {
    const recs = gen.generate(healthySnap, emptyAnal, oppInsights);
    expect(recs[0]!.supportingInsightIds).toContain("OPP_1");
    expect(recs[0]!.supportingInsightIds).toContain("OPP_2");
  });
});

describe("InvestmentRecommendationGenerator — guard conditions", () => {
  it("no OPPORTUNITY insights → []", () => {
    const noOpp = makeInsightSnapshot("u1", [
      makeInsight("RISK_1", InsightMetricCategory.SAVINGS, InsightType.RISK),
    ]);
    expect(gen.generate(healthySnap, emptyAnal, noOpp)).toHaveLength(0);
  });

  it("OPPORTUNITY insights but unhealthy cash flow → []", () => {
    expect(gen.generate(unhealthyCfSnap, emptyAnal, oppInsights)).toHaveLength(0);
  });

  it("OPPORTUNITY insights but unhealthy savings rate → []", () => {
    expect(gen.generate(unhealthySrSnap, emptyAnal, oppInsights)).toHaveLength(0);
  });

  it("no cash flow or savings rate eval (conservative) → []", () => {
    const noEvals = makeMetricsSnapshot("u1", []);
    expect(gen.generate(noEvals, emptyAnal, oppInsights)).toHaveLength(0);
  });

  it("empty insights → []", () => {
    expect(gen.generate(healthySnap, emptyAnal, emptyIns)).toHaveLength(0);
  });
});
