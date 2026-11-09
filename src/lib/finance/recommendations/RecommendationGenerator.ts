import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { Recommendation } from "./Recommendation";
import type { RecommendationGeneratorDefinition } from "./RecommendationGeneratorDefinition";

/**
 * Plugin interface for recommendation generation.
 *
 * Each RecommendationGenerator focuses on one financial domain (debt, savings,
 * risk mitigation, etc.) and produces zero or more Recommendations from the
 * three input snapshots.
 *
 * Contract:
 *   - Receive all three snapshots. Never access repositories, metrics engines,
 *     or analytics engines directly — consume only snapshot data.
 *   - Return a ReadonlyArray<Recommendation>. May be empty.
 *   - Must be pure and synchronous — no I/O, no AI calls.
 *   - Must not perform financial calculations — interpret snapshot data only.
 *   - Must not throw — return an empty array when no recommendations apply.
 *
 * Registration:
 *   RecommendationRegistry.register(new MyRecommendationGenerator())
 *
 * Wiring:
 *   createDefaultRecommendationEngine() in generators/index.ts is the sole
 *   place where concrete generators are named. RecommendationEngine never names them.
 */
export interface RecommendationGenerator {
  definition(): RecommendationGeneratorDefinition;
  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): ReadonlyArray<Recommendation>;
}
