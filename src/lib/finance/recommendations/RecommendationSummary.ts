import type { RecommendationCategory } from "./RecommendationCategory";

/**
 * Lightweight read model derived from a RecommendationSnapshot.
 *
 * Suitable for dashboard cards, notification badges, and AI Coach context loading.
 * Does not carry recommendation details — those remain in the full snapshot.
 */
export interface RecommendationSummary {
  readonly userId: string;
  readonly generatedAt: Date;
  readonly totalRecommendations: number;
  readonly criticalRecommendations: number;
  readonly highRecommendations: number;
  readonly mediumRecommendations: number;
  readonly lowRecommendations: number;
  /** Breakdown of recommendation counts by category. */
  readonly recommendationsByCategory: ReadonlyArray<{
    readonly category: RecommendationCategory;
    readonly count: number;
  }>;
  /** True when at least one CRITICAL recommendation is present. */
  readonly hasCritical: boolean;
  /** True when at least one generator threw. */
  readonly hasFailures: boolean;
}
