// @depends-on: IFinancialInsightService, FinancialInsightSnapshot, IAnalyticsService, AnalyticsSnapshot, IFinancialMetricsSnapshotService, FinancialMetricsSnapshot

import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "./RecommendationSnapshot";
import type { RecommendationGeneratorType } from "./RecommendationGeneratorType";

/**
 * Contract for the Recommendation Engine.
 *
 * RecommendationEngine consumes the three upstream snapshots and produces one
 * RecommendationSnapshot. It knows nothing about individual generators — it
 * delegates entirely to RecommendationRegistry.
 *
 * Instantiate via createDefaultRecommendationEngine() from generators/index.ts.
 */
export interface IRecommendationEngine {
  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): RecommendationSnapshot;
  registeredGenerators(): ReadonlyArray<RecommendationGeneratorType>;
}
