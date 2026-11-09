import { describe, it, expect } from "vitest";
import { FinancialReviewService } from "../FinancialReviewService";
import { FinancialHealthTier } from "../FinancialHealthTier";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import { RecommendationCategory } from "../../recommendations/RecommendationCategory";
import { RecommendationPriority } from "../../recommendations/RecommendationPriority";
import { MetricType } from "../../metrics/MetricType";
import {
  makeEvaluation,
  makeMetricsSnapshot,
  makeThreshold,
  makeInsight,
  makeInsightSnapshot,
  makeRecommendation,
  makeRecommendationSnapshot,
} from "./testHelpers";

const service = new FinancialReviewService();

const SR_THRESHOLD  = makeThreshold(0.20, null);
const DTI_THRESHOLD = makeThreshold(null, 0.36);

const emptyMetrics = makeMetricsSnapshot("u1", []);
const emptyInsights = makeInsightSnapshot("u1", []);
const emptyRecs     = makeRecommendationSnapshot("u1", []);

describe("FinancialReviewService — build()", () => {
  it("delegates to FinancialReviewBuilder and returns a FinancialReview", () => {
    const review = service.build(emptyMetrics, emptyInsights, emptyRecs);
    expect(review.userId).toBe("u1");
    expect(review.snapshotVersion).toBe("1.0.0");
    expect(review.executiveSummary.type).toBe("EXECUTIVE_SUMMARY");
  });
});

describe("FinancialReviewService — summarise()", () => {
  it("summary mirrors executiveSummary fields", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("R1", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("P1", InsightMetricCategory.SAVINGS, InsightType.POSITIVE),
    ]);
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("C1", RecommendationCategory.DEBT, RecommendationPriority.CRITICAL),
      makeRecommendation("H1", RecommendationCategory.SAVINGS, RecommendationPriority.HIGH),
    ]);
    const review = service.build(emptyMetrics, insights, recs);
    const summary = service.summarise(review);

    expect(summary.id).toBe(review.id);
    expect(summary.userId).toBe("u1");
    expect(summary.overallHealthScore).toBe(review.executiveSummary.overallHealthScore);
    expect(summary.healthTier).toBe(review.executiveSummary.healthTier);
    expect(summary.urgentRecommendationCount).toBe(2);
    expect(summary.achievementCount).toBe(1);
    expect(summary.totalCriticalAndHighConcerns).toBe(1);
    expect(summary.topConcernInsightId).toBe("R1");
  });

  it("summary.urgentRecommendationCount = critical + high rec counts", () => {
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("C1", RecommendationCategory.DEBT,    RecommendationPriority.CRITICAL),
      makeRecommendation("H1", RecommendationCategory.SAVINGS, RecommendationPriority.HIGH),
      makeRecommendation("M1", RecommendationCategory.SAVINGS, RecommendationPriority.MEDIUM),
    ]);
    const review  = service.build(emptyMetrics, emptyInsights, recs);
    const summary = service.summarise(review);
    expect(summary.urgentRecommendationCount).toBe(2);
  });
});

describe("FinancialReviewService — allReferencedInsightIds()", () => {
  it("returns deduplicated union across all sections", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("RISK_1",  InsightMetricCategory.DEBT,    InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("POS_1",   InsightMetricCategory.SAVINGS, InsightType.POSITIVE),
      makeInsight("GOAL_1",  InsightMetricCategory.GOALS,   InsightType.WARNING),
    ]);
    const review = service.build(emptyMetrics, insights, emptyRecs);
    const ids = service.allReferencedInsightIds(review);
    expect(Array.isArray(ids)).toBe(true);
    // IDs should be unique
    expect(new Set(ids).size).toBe(ids.length);
    // topConcern should be in there
    expect(ids).toContain("RISK_1");
  });
});

describe("FinancialReviewService — allReferencedRecommendationIds()", () => {
  it("returns deduplicated recommendation IDs from all sections", () => {
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("C1", RecommendationCategory.DEBT,  RecommendationPriority.CRITICAL),
      makeRecommendation("M1", RecommendationCategory.GOAL,  RecommendationPriority.MEDIUM),
    ]);
    const review = service.build(emptyMetrics, emptyInsights, recs);
    const ids = service.allReferencedRecommendationIds(review);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("C1");
    expect(ids).toContain("M1");
  });
});

describe("FinancialReviewService — allReferencedMetricTypes()", () => {
  it("returns deduplicated metric types from health + coach + focus sections", () => {
    const metrics = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.SAVINGS_RATE,        0.25, SR_THRESHOLD,  true,  0.05),
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.45, DTI_THRESHOLD, false, -0.09),
    ]);
    const review = service.build(metrics, emptyInsights, emptyRecs);
    const types = service.allReferencedMetricTypes(review);
    expect(new Set(types).size).toBe(types.length);
    expect(types).toContain(MetricType.SAVINGS_RATE);
    expect(types).toContain(MetricType.DEBT_TO_INCOME_RATIO);
  });
});
