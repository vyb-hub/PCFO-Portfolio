import type { Recommendation } from "./Recommendation";
import type { RecommendationMetadata } from "./RecommendationMetadata";

/**
 * A record of a single generator that threw during RecommendationEngine.generate().
 *
 * Captured failures do not abort the generation run — partial snapshots
 * (some generators succeeded, some failed) are still valid and usable.
 */
export interface RecommendationGenerationFailure {
  readonly generatorName: string;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

/**
 * An immutable point-in-time record of all financial recommendations derived
 * from one FinancialMetricsSnapshot + AnalyticsSnapshot + InsightSnapshot.
 *
 * RecommendationSnapshot is the official contract between the Recommendation
 * Platform and all downstream consumers (AI Coach, Dashboard, What-If Engine,
 * Reports).
 *
 * No downstream consumer should reference RecommendationGenerator implementations
 * or RecommendationEngine directly. No downstream consumer needs to know which
 * generators ran, how recommendations were produced, or what input data was used.
 *
 * Recommendations are sorted by priority: CRITICAL → HIGH → MEDIUM → LOW.
 *
 * Construction:
 *   const snapshot = new RecommendationEngine(registry).generate(metrics, analytics, insights);
 *
 * Access:
 *   service.getByCategory(snapshot, RecommendationCategory.DEBT)
 *   service.getByPriority(snapshot, RecommendationPriority.CRITICAL)
 */
export interface RecommendationSnapshot {
  readonly userId: string;
  readonly metadata: RecommendationMetadata;
  /** All recommendations, sorted CRITICAL → HIGH → MEDIUM → LOW. */
  readonly recommendations: ReadonlyArray<Recommendation>;
  /** Generators that threw during execution. */
  readonly failures: ReadonlyArray<RecommendationGenerationFailure>;
}
