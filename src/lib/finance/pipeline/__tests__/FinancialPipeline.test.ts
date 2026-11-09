import { describe, it, expect, vi } from "vitest";
import { FinancialPipeline } from "../FinancialPipeline";
import { FinancialAggregator } from "../../aggregation/FinancialAggregator";
import { FinancialMetricsSnapshotService } from "../../metrics/snapshot/FinancialMetricsSnapshotService";
import { FinancialReviewService } from "../../reviews/FinancialReviewService";
import { createDefaultMetricsEngine } from "../../metrics/calculators/index";
import { createDefaultTrendService } from "../../trends/analyzers/index";
import { createDefaultAnalyticsEngine } from "../../analytics/analyzers/index";
import { createDefaultFinancialInsightService } from "../../insights/generators/financialInsightFactory";
import { createDefaultRecommendationEngine } from "../../recommendations/generators/index";
import { createDefaultStoryEngine } from "../../story/StoryFactory";

// Minimal stub repositories — no transactions, debts, goals, or investments
const stubTransactionRepo = {
  findByPeriod:   vi.fn().mockResolvedValue([]),
  findByCategory: vi.fn().mockResolvedValue([]),
  findRecurring:  vi.fn().mockResolvedValue([]),
  findRecent:     vi.fn().mockResolvedValue([]),
};
const stubDebtRepo = {
  findByUser:   vi.fn().mockResolvedValue([]),
  findActive:   vi.fn().mockResolvedValue([]),
  findByStatus: vi.fn().mockResolvedValue([]),
  findById:     vi.fn().mockResolvedValue(null),
};
const stubGoalRepo = {
  findByUser:   vi.fn().mockResolvedValue([]),
  findActive:   vi.fn().mockResolvedValue([]),
  findByStatus: vi.fn().mockResolvedValue([]),
  findById:     vi.fn().mockResolvedValue(null),
};
const stubInvestmentRepo = {
  findByUser:   vi.fn().mockResolvedValue([]),
  findActive:   vi.fn().mockResolvedValue([]),
  findByStatus: vi.fn().mockResolvedValue([]),
  findById:     vi.fn().mockResolvedValue(null),
};
const stubBudgetRepo = {
  findByUser:     vi.fn().mockResolvedValue([]),
  findActive:     vi.fn().mockResolvedValue([]),
  findByPeriod:   vi.fn().mockResolvedValue([]),
  findByCategory: vi.fn().mockResolvedValue([]),
};
const stubRecurringRepo = {
  findByUser:   vi.fn().mockResolvedValue([]),
  findActive:   vi.fn().mockResolvedValue([]),
};

function buildPipeline(): FinancialPipeline {
  const aggregator = new FinancialAggregator(
    stubTransactionRepo,
    stubDebtRepo,
    stubGoalRepo,
    stubInvestmentRepo,
    stubBudgetRepo,
    stubRecurringRepo,
  );

  return new FinancialPipeline(
    aggregator,
    new FinancialMetricsSnapshotService(createDefaultMetricsEngine()),
    createDefaultTrendService(),
    createDefaultAnalyticsEngine(),
    createDefaultFinancialInsightService(),
    createDefaultRecommendationEngine(),
    new FinancialReviewService(),
    createDefaultStoryEngine(),
  );
}

describe("FinancialPipeline — run()", () => {
  it("returns a complete PipelineResult for a user with no data", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.metadata.userId).toBe("u1");
    expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.metadata.historicalSnapshotCount).toBe(1);
  });

  it("produces a FinancialAggregate for the current month", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.aggregate.userId).toBe("u1");
    expect(result.aggregate.period.granularity).toBe("MONTHLY");
  });

  it("produces a FinancialMetricsSnapshot", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.metricsSnapshot.userId).toBe("u1");
    expect(result.metricsSnapshot.results.length).toBeGreaterThan(0);
  });

  it("produces a TrendReport (INSUFFICIENT_DATA on first run)", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.trendReport).toBeDefined();
    // With 1 snapshot, all trends return INSUFFICIENT_DATA
    for (const trend of result.trendReport.trends) {
      expect(trend.direction).toBe("INSUFFICIENT_DATA");
    }
  });

  it("produces an AnalyticsSnapshot — only RiskAnalyzer runs on first run", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    // 5 of 6 analyzers require >1 snapshot; only RiskAnalyzer (min=1) runs
    expect(result.analyticsSnapshot.metadata.analyzersSkipped).toBeGreaterThanOrEqual(4);
    expect(result.analyticsSnapshot.metadata.analyzersRun).toBeGreaterThanOrEqual(1);
  });

  it("metadata.analyticsAnalyzersSkipped matches snapshot", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.metadata.analyticsAnalyzersSkipped).toBe(
      result.analyticsSnapshot.metadata.analyzersSkipped,
    );
  });

  it("produces an InsightSnapshot", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.insightSnapshot).toBeDefined();
    expect(result.insightSnapshot.userId).toBe("u1");
  });

  it("produces a RecommendationSnapshot", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.recommendationSnapshot).toBeDefined();
    expect(result.recommendationSnapshot.userId).toBe("u1");
  });

  it("produces a FinancialReview with all 8 sections", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    const review = result.review;
    expect(review.userId).toBe("u1");
    expect(review.executiveSummary).toBeDefined();
    expect(review.financialHealth).toBeDefined();
    expect(review.achievements).toBeDefined();
    expect(review.risks).toBeDefined();
    expect(review.goalProgress).toBeDefined();
    expect(review.recommendations).toBeDefined();
    expect(review.coachSummary).toBeDefined();
    expect(review.nextMonthFocus).toBeDefined();
  });

  it("produces a FinancialStorySnapshot with no stories when there's no expense data", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.storySnapshot).toBeDefined();
    expect(result.storySnapshot.userId).toBe("u1");
    // No transactions in the stub repos → LargestExpenseFinder returns null → no blocks/stories
    expect(result.storySnapshot.stories.length).toBe(0);
    expect(result.storySnapshot.failures.length).toBe(0);
  });

  it("all intermediate snapshots share the same userId", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(result.aggregate.userId).toBe("u1");
    expect(result.metricsSnapshot.userId).toBe("u1");
    expect(result.insightSnapshot.userId).toBe("u1");
    expect(result.recommendationSnapshot.userId).toBe("u1");
    expect(result.review.userId).toBe("u1");
    expect(result.storySnapshot.userId).toBe("u1");
  });

  it("result is frozen (immutable)", async () => {
    const pipeline = buildPipeline();
    const result = await pipeline.run("u1");

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
  });
});
