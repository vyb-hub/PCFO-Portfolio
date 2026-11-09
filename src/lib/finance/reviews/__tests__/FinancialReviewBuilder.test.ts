import { describe, it, expect } from "vitest";
import { FinancialReviewBuilder } from "../FinancialReviewBuilder";
import { FinancialHealthTier } from "../FinancialHealthTier";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import { RecommendationCategory } from "../../recommendations/RecommendationCategory";
import { RecommendationPriority } from "../../recommendations/RecommendationPriority";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import {
  makeEvaluation,
  makeMetricsSnapshot,
  makeThreshold,
  makeInsight,
  makeInsightSnapshot,
  makeRecommendation,
  makeRecommendationSnapshot,
} from "./testHelpers";

const builder = new FinancialReviewBuilder();

const SR_THRESHOLD = makeThreshold(0.20, null);
const DTI_THRESHOLD = makeThreshold(null, 0.36);

const allHealthy = makeMetricsSnapshot("u1", [
  makeEvaluation(MetricType.SAVINGS_RATE, 0.25, SR_THRESHOLD, true, 0.05),
  makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.30, DTI_THRESHOLD, true, 0.06),
]);
const allUnhealthy = makeMetricsSnapshot("u1", [
  makeEvaluation(MetricType.SAVINGS_RATE, 0.05, SR_THRESHOLD, false, -0.15),
  makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.45, DTI_THRESHOLD, false, -0.09),
]);
const emptyMetrics   = makeMetricsSnapshot("u1", []);
const emptyInsights  = makeInsightSnapshot("u1", []);
const emptyRecs      = makeRecommendationSnapshot("u1", []);

describe("FinancialReviewBuilder — structure", () => {
  it("returns a FinancialReview with all 8 sections", () => {
    const r = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r.executiveSummary).toBeDefined();
    expect(r.financialHealth).toBeDefined();
    expect(r.achievements).toBeDefined();
    expect(r.risks).toBeDefined();
    expect(r.goalProgress).toBeDefined();
    expect(r.recommendations).toBeDefined();
    expect(r.coachSummary).toBeDefined();
    expect(r.nextMonthFocus).toBeDefined();
  });

  it("review.userId matches metricsSnapshot.userId", () => {
    const r = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r.userId).toBe("u1");
    expect(r.metadata.userId).toBe("u1");
  });

  it("period inherited from metricsSnapshot", () => {
    const r = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r.period.label).toBe("2026-06");
  });

  it("each review has a unique id", () => {
    const r1 = builder.build(allHealthy, emptyInsights, emptyRecs);
    const r2 = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r1.id).not.toBe(r2.id);
  });
});

describe("FinancialReviewBuilder — health score and tier", () => {
  it("all healthy metrics → score = 1.0 → EXCELLENT tier", () => {
    const r = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r.executiveSummary.overallHealthScore).toBe(1.0);
    expect(r.executiveSummary.healthTier).toBe(FinancialHealthTier.EXCELLENT);
  });

  it("no healthy metrics → score = 0.0 → CRITICAL tier", () => {
    const r = builder.build(allUnhealthy, emptyInsights, emptyRecs);
    expect(r.executiveSummary.overallHealthScore).toBe(0.0);
    expect(r.executiveSummary.healthTier).toBe(FinancialHealthTier.CRITICAL);
  });

  it("no evaluations → score defaults to 1.0 → EXCELLENT", () => {
    const r = builder.build(emptyMetrics, emptyInsights, emptyRecs);
    expect(r.executiveSummary.overallHealthScore).toBe(1.0);
    expect(r.executiveSummary.healthTier).toBe(FinancialHealthTier.EXCELLENT);
  });

  it("1 of 2 healthy → score = 0.5 → FAIR", () => {
    const mixed = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.SAVINGS_RATE, 0.25, SR_THRESHOLD, true, 0.05),
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.45, DTI_THRESHOLD, false, -0.09),
    ]);
    const r = builder.build(mixed, emptyInsights, emptyRecs);
    expect(r.executiveSummary.overallHealthScore).toBe(0.5);
    expect(r.executiveSummary.healthTier).toBe(FinancialHealthTier.FAIR);
  });
});

describe("FinancialReviewBuilder — financialHealth section", () => {
  it("unhealthyMetricTypes sorted by |distanceFromThreshold| descending", () => {
    const snap = makeMetricsSnapshot("u1", [
      makeEvaluation(MetricType.SAVINGS_RATE, 0.05, SR_THRESHOLD, false, -0.15, MetricUnit.PERCENTAGE),
      makeEvaluation(MetricType.DEBT_TO_INCOME_RATIO, 0.45, DTI_THRESHOLD, false, -0.09, MetricUnit.RATIO),
    ]);
    const r = builder.build(snap, emptyInsights, emptyRecs);
    // SAVINGS_RATE has |distance| 0.15, DTI has 0.09 — SAVINGS_RATE should be first
    expect(r.financialHealth.unhealthyMetricTypes[0]).toBe(MetricType.SAVINGS_RATE);
    expect(r.financialHealth.unhealthyMetricTypes[1]).toBe(MetricType.DEBT_TO_INCOME_RATIO);
  });

  it("healthyMetricCount + unhealthyMetricCount = total evaluations", () => {
    const r = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r.financialHealth.healthyMetricCount + r.financialHealth.unhealthyMetricCount)
      .toBe(allHealthy.evaluations.length);
  });
});

describe("FinancialReviewBuilder — executiveSummary signals", () => {
  it("topConcernInsightId = highest severity RISK insight", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("RISK_LOW",  InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.LOW),
      makeInsight("RISK_CRIT", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("RISK_MED",  InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.MEDIUM),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.executiveSummary.topConcernInsightId).toBe("RISK_CRIT");
  });

  it("topConcernInsightId is null when no RISK insights exist", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("W1", InsightMetricCategory.SAVINGS, InsightType.WARNING),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.executiveSummary.topConcernInsightId).toBeNull();
  });

  it("topAchievementInsightId = highest confidence POSITIVE insight", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("POS_LOW",  InsightMetricCategory.SAVINGS, InsightType.POSITIVE, InsightSeverityLevel.LOW, 0.60),
      makeInsight("POS_HIGH", InsightMetricCategory.SAVINGS, InsightType.POSITIVE, InsightSeverityLevel.LOW, 0.90),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.executiveSummary.topAchievementInsightId).toBe("POS_HIGH");
  });

  it("positiveSignalCount includes POSITIVE and MILESTONE insights", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("P1",  InsightMetricCategory.SAVINGS,  InsightType.POSITIVE),
      makeInsight("M1",  InsightMetricCategory.SAVINGS,  InsightType.MILESTONE),
      makeInsight("R1",  InsightMetricCategory.DEBT,     InsightType.RISK),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.executiveSummary.positiveSignalCount).toBe(2);
  });

  it("criticalInsightCount and criticalRecommendationCount correct", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("C1", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.CRITICAL),
    ]);
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("RC1", RecommendationCategory.DEBT, RecommendationPriority.CRITICAL),
    ]);
    const r = builder.build(emptyMetrics, insights, recs);
    expect(r.executiveSummary.criticalInsightCount).toBe(1);
    expect(r.executiveSummary.criticalRecommendationCount).toBe(1);
  });
});

describe("FinancialReviewBuilder — achievements section", () => {
  it("POSITIVE insights populate achievementInsightIds sorted by confidence", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("P1", InsightMetricCategory.SAVINGS, InsightType.POSITIVE, InsightSeverityLevel.LOW, 0.70),
      makeInsight("P2", InsightMetricCategory.SAVINGS, InsightType.POSITIVE, InsightSeverityLevel.LOW, 0.90),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.achievements.achievementInsightIds[0]).toBe("P2");
    expect(r.achievements.achievementInsightIds[1]).toBe("P1");
  });

  it("MILESTONE insights populate milestoneInsightIds", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("M1", InsightMetricCategory.SAVINGS, InsightType.MILESTONE),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.achievements.milestoneInsightIds).toContain("M1");
    expect(r.achievements.totalAchievements).toBe(1);
  });

  it("totalAchievements = achievementInsightIds + milestoneInsightIds lengths", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("P1", InsightMetricCategory.SAVINGS,      InsightType.POSITIVE),
      makeInsight("M1", InsightMetricCategory.EMERGENCY_FUND, InsightType.MILESTONE),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.achievements.totalAchievements).toBe(2);
  });
});

describe("FinancialReviewBuilder — risks section", () => {
  it("RISK insights sorted CRITICAL → LOW in riskInsightIds", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("R_LOW",  InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.LOW),
      makeInsight("R_CRIT", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.CRITICAL),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.risks.riskInsightIds[0]).toBe("R_CRIT");
    expect(r.risks.riskInsightIds[1]).toBe("R_LOW");
  });

  it("WARNING insights → warningInsightIds", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("W1", InsightMetricCategory.SAVINGS, InsightType.WARNING),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.risks.warningInsightIds).toContain("W1");
  });

  it("CRITICAL + HIGH recommendations → urgentRecommendationIds", () => {
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("C1", RecommendationCategory.DEBT,    RecommendationPriority.CRITICAL),
      makeRecommendation("H1", RecommendationCategory.SAVINGS, RecommendationPriority.HIGH),
      makeRecommendation("M1", RecommendationCategory.SAVINGS, RecommendationPriority.MEDIUM),
    ]);
    const r = builder.build(emptyMetrics, emptyInsights, recs);
    expect(r.risks.urgentRecommendationIds).toContain("C1");
    expect(r.risks.urgentRecommendationIds).toContain("H1");
    expect(r.risks.urgentRecommendationIds).not.toContain("M1");
  });

  it("criticalRiskCount counts only RISK + CRITICAL", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("R_CRIT", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.CRITICAL),
      makeInsight("W_CRIT", InsightMetricCategory.DEBT, InsightType.WARNING, InsightSeverityLevel.CRITICAL),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.risks.criticalRiskCount).toBe(1);
  });
});

describe("FinancialReviewBuilder — goalProgress section", () => {
  it("GOALS category insights → goalInsightIds", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("G1", InsightMetricCategory.GOALS,   InsightType.WARNING),
      makeInsight("S1", InsightMetricCategory.SAVINGS, InsightType.RISK),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.goalProgress.goalInsightIds).toContain("G1");
    expect(r.goalProgress.goalInsightIds).not.toContain("S1");
  });

  it("GOAL category recommendations → goalRecommendationIds", () => {
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("GR1", RecommendationCategory.GOAL,    RecommendationPriority.MEDIUM),
      makeRecommendation("DR1", RecommendationCategory.DEBT,    RecommendationPriority.CRITICAL),
    ]);
    const r = builder.build(emptyMetrics, emptyInsights, recs);
    expect(r.goalProgress.goalRecommendationIds).toContain("GR1");
    expect(r.goalProgress.goalRecommendationIds).not.toContain("DR1");
  });

  it("MILESTONE insights appear in both achievements and goalProgress", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("M1", InsightMetricCategory.EMERGENCY_FUND, InsightType.MILESTONE),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.achievements.milestoneInsightIds).toContain("M1");
    expect(r.goalProgress.milestoneInsightIds).toContain("M1");
  });
});

describe("FinancialReviewBuilder — recommendations section", () => {
  it("recommendations grouped correctly by priority", () => {
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("C1", RecommendationCategory.DEBT,    RecommendationPriority.CRITICAL),
      makeRecommendation("H1", RecommendationCategory.SAVINGS, RecommendationPriority.HIGH),
      makeRecommendation("M1", RecommendationCategory.SAVINGS, RecommendationPriority.MEDIUM),
      makeRecommendation("L1", RecommendationCategory.SAVINGS, RecommendationPriority.LOW),
    ]);
    const r = builder.build(emptyMetrics, emptyInsights, recs);
    expect(r.recommendations.criticalRecommendationIds).toContain("C1");
    expect(r.recommendations.highRecommendationIds).toContain("H1");
    expect(r.recommendations.mediumRecommendationIds).toContain("M1");
    expect(r.recommendations.lowRecommendationIds).toContain("L1");
    expect(r.recommendations.totalCount).toBe(4);
  });
});

describe("FinancialReviewBuilder — coachSummary section", () => {
  it("primaryInsightIds limited to 5", () => {
    const insights = makeInsightSnapshot("u1", Array.from({ length: 8 }, (_, i) =>
      makeInsight(`RISK_${i}`, InsightMetricCategory.DEBT, InsightType.RISK),
    ));
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.coachSummary.primaryInsightIds.length).toBeLessThanOrEqual(5);
  });

  it("primaryRecommendationIds limited to 3", () => {
    const recs = makeRecommendationSnapshot("u1", Array.from({ length: 5 }, (_, i) =>
      makeRecommendation(`H_${i}`, RecommendationCategory.DEBT, RecommendationPriority.HIGH),
    ));
    const r = builder.build(emptyMetrics, emptyInsights, recs);
    expect(r.coachSummary.primaryRecommendationIds.length).toBeLessThanOrEqual(3);
  });

  it("isPositivePeriod = true when all metrics healthy", () => {
    const r = builder.build(allHealthy, emptyInsights, emptyRecs);
    expect(r.coachSummary.isPositivePeriod).toBe(true);
  });

  it("isPositivePeriod = false when no metrics healthy", () => {
    const r = builder.build(allUnhealthy, emptyInsights, emptyRecs);
    expect(r.coachSummary.isPositivePeriod).toBe(false);
  });
});

describe("FinancialReviewBuilder — nextMonthFocus section", () => {
  it("priorityActionIds = CRITICAL + HIGH recommendations", () => {
    const recs = makeRecommendationSnapshot("u1", [
      makeRecommendation("C1", RecommendationCategory.DEBT,    RecommendationPriority.CRITICAL),
      makeRecommendation("H1", RecommendationCategory.SAVINGS, RecommendationPriority.HIGH),
      makeRecommendation("M1", RecommendationCategory.SAVINGS, RecommendationPriority.MEDIUM),
    ]);
    const r = builder.build(emptyMetrics, emptyInsights, recs);
    expect(r.nextMonthFocus.priorityActionIds).toContain("C1");
    expect(r.nextMonthFocus.priorityActionIds).toContain("H1");
    expect(r.nextMonthFocus.priorityActionIds).not.toContain("M1");
  });

  it("watchlistMetricTypes = unhealthy metric types", () => {
    const r = builder.build(allUnhealthy, emptyInsights, emptyRecs);
    expect(r.nextMonthFocus.watchlistMetricTypes).toContain(MetricType.SAVINGS_RATE);
    expect(r.nextMonthFocus.watchlistMetricTypes).toContain(MetricType.DEBT_TO_INCOME_RATIO);
  });

  it("activeRiskInsightIds = RISK insight IDs sorted by severity", () => {
    const insights = makeInsightSnapshot("u1", [
      makeInsight("R_LOW",  InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.LOW),
      makeInsight("R_HIGH", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.HIGH),
    ]);
    const r = builder.build(emptyMetrics, insights, emptyRecs);
    expect(r.nextMonthFocus.activeRiskInsightIds[0]).toBe("R_HIGH");
    expect(r.nextMonthFocus.activeRiskInsightIds[1]).toBe("R_LOW");
  });
});

describe("FinancialReviewBuilder — empty snapshots", () => {
  it("empty inputs → review with zeroed counts, no errors", () => {
    const r = builder.build(emptyMetrics, emptyInsights, emptyRecs);
    expect(r.executiveSummary.criticalInsightCount).toBe(0);
    expect(r.executiveSummary.topConcernInsightId).toBeNull();
    expect(r.executiveSummary.topAchievementInsightId).toBeNull();
    expect(r.achievements.totalAchievements).toBe(0);
    expect(r.risks.riskInsightIds).toHaveLength(0);
    expect(r.recommendations.totalCount).toBe(0);
    expect(r.metadata.totalInsightsConsidered).toBe(0);
  });
});
