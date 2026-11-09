import type { PrismaClient } from "@prisma/client";
import { FinancialAggregator } from "../aggregation/FinancialAggregator";
import { FinancialMetricsSnapshotService } from "../metrics/snapshot/FinancialMetricsSnapshotService";
import { FinancialReviewService } from "../reviews/FinancialReviewService";
import { createDefaultMetricsEngine } from "../metrics/calculators/index";
import { createDefaultTrendService } from "../trends/analyzers/index";
import { createDefaultAnalyticsEngine } from "../analytics/analyzers/index";
import { createDefaultFinancialInsightService } from "../insights/generators/financialInsightFactory";
import { createDefaultRecommendationEngine } from "../recommendations/generators/index";
import { createDefaultStoryEngine } from "../story/StoryFactory";
import { createDefaultRepositories } from "../../infrastructure/repositories/index";
import { FinancialPipeline } from "./FinancialPipeline";
import type { IFinancialPipeline } from "./IFinancialPipeline";
import { FinancialStateService } from "./FinancialStateService";
import type { IFinancialStateService } from "./IFinancialStateService";

/**
 * Wires all Financial Intelligence Platform layers into a ready-to-use pipeline.
 *
 * Call this once at application startup and inject the result where needed.
 * All services are stateless so a single instance can be shared across requests.
 */
export function createDefaultPipeline(db: PrismaClient): IFinancialPipeline {
  const repos = createDefaultRepositories(db);

  const aggregator = new FinancialAggregator(
    repos.transactions,
    repos.debts,
    repos.goals,
    repos.investments,
    repos.budgets,
    repos.recurringPayments,
  );

  const metricsService = new FinancialMetricsSnapshotService(createDefaultMetricsEngine());
  const trendService   = createDefaultTrendService();
  const analyticsEngine = createDefaultAnalyticsEngine();
  const insightService  = createDefaultFinancialInsightService();
  const recommendationEngine = createDefaultRecommendationEngine();
  const reviewService   = new FinancialReviewService();
  const storyEngine     = createDefaultStoryEngine();

  return new FinancialPipeline(
    aggregator,
    metricsService,
    trendService,
    analyticsEngine,
    insightService,
    recommendationEngine,
    reviewService,
    storyEngine,
  );
}

/**
 * Wires the shared entry point every consumer (Dashboard, Telegram, Email,
 * Push, Voice, future APIs) should call instead of createDefaultPipeline()
 * directly. See IFinancialStateService.
 */
export function createDefaultFinancialStateService(db: PrismaClient): IFinancialStateService {
  return new FinancialStateService(createDefaultPipeline(db));
}
