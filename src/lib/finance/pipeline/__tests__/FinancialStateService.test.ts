import { describe, it, expect, beforeAll } from "vitest";
import { FinancialStateService } from "../FinancialStateService";
import { FinancialPipeline } from "../FinancialPipeline";
import type { IFinancialPipeline } from "../IFinancialPipeline";
import type { PipelineResult } from "../PipelineResult";
import { FinancialAggregator } from "../../aggregation/FinancialAggregator";
import { FinancialMetricsSnapshotService } from "../../metrics/snapshot/FinancialMetricsSnapshotService";
import { FinancialReviewService } from "../../reviews/FinancialReviewService";
import { createDefaultMetricsEngine } from "../../metrics/calculators/index";
import { createDefaultTrendService } from "../../trends/analyzers/index";
import { createDefaultAnalyticsEngine } from "../../analytics/analyzers/index";
import { createDefaultFinancialInsightService } from "../../insights/generators/financialInsightFactory";
import { createDefaultRecommendationEngine } from "../../recommendations/generators/index";
import { createDefaultStoryEngine } from "../../story/StoryFactory";

const stubRepo = { findByPeriod: async () => [], findByCategory: async () => [], findRecurring: async () => [], findRecent: async () => [] };
const stubEntityRepo = { findByUser: async () => [], findActive: async () => [], findByStatus: async () => [], findById: async () => null };
const stubBudgetRepo = { findByUser: async () => [], findActive: async () => [], findByPeriod: async () => [], findByCategory: async () => [] };
const stubRecurringRepo = { findByUser: async () => [], findActive: async () => [] };

let realResult: PipelineResult;

beforeAll(async () => {
  const aggregator = new FinancialAggregator(stubRepo, stubEntityRepo, stubEntityRepo, stubEntityRepo, stubBudgetRepo, stubRecurringRepo);
  const pipeline = new FinancialPipeline(
    aggregator,
    new FinancialMetricsSnapshotService(createDefaultMetricsEngine()),
    createDefaultTrendService(),
    createDefaultAnalyticsEngine(),
    createDefaultFinancialInsightService(),
    createDefaultRecommendationEngine(),
    new FinancialReviewService(),
    createDefaultStoryEngine(),
  );
  realResult = await pipeline.run("u1");
});

function fakePipeline(): IFinancialPipeline {
  return { run: async () => realResult };
}

describe("FinancialStateService", () => {
  it("getPipelineResult returns the full PipelineResult", async () => {
    const service = new FinancialStateService(fakePipeline());
    const result = await service.getPipelineResult("u1");
    expect(result).toBe(realResult);
  });

  it("getLatestReview returns just the review", async () => {
    const service = new FinancialStateService(fakePipeline());
    const review = await service.getLatestReview("u1");
    expect(review).toBe(realResult.review);
  });

  it("getConversationInput narrows to story/review/insight/recommendation", async () => {
    const service = new FinancialStateService(fakePipeline());
    const input = await service.getConversationInput("u1");

    expect(input.userId).toBe("u1");
    expect(input.storySnapshot).toBe(realResult.storySnapshot);
    expect(input.review).toBe(realResult.review);
    expect(input.insightSnapshot).toBe(realResult.insightSnapshot);
    expect(input.recommendationSnapshot).toBe(realResult.recommendationSnapshot);
    // deliberately excludes aggregate/metrics/analytics/trends
    expect(input).not.toHaveProperty("aggregate");
    expect(input).not.toHaveProperty("metricsSnapshot");
  });
});
