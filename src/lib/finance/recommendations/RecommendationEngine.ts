import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { IRecommendationEngine } from "./IRecommendationEngine";
import type { RecommendationGenerationFailure, RecommendationSnapshot } from "./RecommendationSnapshot";
import type { RecommendationMetadata } from "./RecommendationMetadata";
import type { Recommendation } from "./Recommendation";
import type { RecommendationGeneratorType } from "./RecommendationGeneratorType";
import { RecommendationPriority } from "./RecommendationPriority";
import { RecommendationRegistry } from "./RecommendationRegistry";

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  [RecommendationPriority.CRITICAL]: 0,
  [RecommendationPriority.HIGH]:     1,
  [RecommendationPriority.MEDIUM]:   2,
  [RecommendationPriority.LOW]:      3,
};

/**
 * Concrete implementation of IRecommendationEngine.
 *
 * RecommendationEngine knows nothing about individual generators — it delegates
 * entirely to RecommendationRegistry. Adding a new generator never requires
 * touching this class.
 *
 * Instantiate via createDefaultRecommendationEngine() from generators/index.ts,
 * or build a custom engine with a subset of generators for testing.
 */
export class RecommendationEngine implements IRecommendationEngine {
  constructor(private readonly registry: RecommendationRegistry) {}

  generate(
    metricsSnapshot: FinancialMetricsSnapshot,
    analyticsSnapshot: AnalyticsSnapshot,
    insightSnapshot: FinancialInsightSnapshot,
  ): RecommendationSnapshot {
    const allRecommendations: Recommendation[] = [];
    const failures: RecommendationGenerationFailure[] = [];
    let generatorsRun = 0;

    for (const generator of this.registry.getAll()) {
      generatorsRun++;
      try {
        const produced = generator.generate(metricsSnapshot, analyticsSnapshot, insightSnapshot);
        allRecommendations.push(...produced);
      } catch (err) {
        failures.push({
          generatorName: generator.definition().name,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    const sorted = [...allRecommendations].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4),
    );

    const criticalRecommendations = sorted.filter((r) => r.priority === RecommendationPriority.CRITICAL).length;
    const highRecommendations     = sorted.filter((r) => r.priority === RecommendationPriority.HIGH).length;
    const mediumRecommendations   = sorted.filter((r) => r.priority === RecommendationPriority.MEDIUM).length;
    const lowRecommendations      = sorted.filter((r) => r.priority === RecommendationPriority.LOW).length;

    const metadata: RecommendationMetadata = {
      userId:                 metricsSnapshot.userId,
      generatedAt:            new Date(),
      metricsGeneratedAt:     metricsSnapshot.metadata.generatedAt,
      analyticsAnalyzedAt:    analyticsSnapshot.metadata.analyzedAt,
      insightsGeneratedAt:    insightSnapshot.generatedAt,
      generatorsRun,
      generatorFailures:      failures.length,
      totalRecommendations:   sorted.length,
      criticalRecommendations,
      highRecommendations,
      mediumRecommendations,
      lowRecommendations,
    };

    return Object.freeze({
      userId:           metricsSnapshot.userId,
      metadata,
      recommendations:  Object.freeze(sorted),
      failures:         Object.freeze(failures),
    });
  }

  registeredGenerators(): ReadonlyArray<RecommendationGeneratorType> {
    return this.registry.getDefinitions().map((d) => d.id);
  }
}
