import type { StoryEngineInput } from "./StoryEngineInput";
import type { IStoryEngine } from "./IStoryEngine";
import type { StoryGenerationFailure, FinancialStorySnapshot } from "./FinancialStorySnapshot";
import type { StoryMetadata } from "./StoryMetadata";
import type { StoryBlock } from "./StoryBlock";
import type { StoryBlockGeneratorType } from "./StoryBlockGeneratorType";
import { StoryRegistry } from "./StoryRegistry";
import { StoryBuilder } from "./StoryBuilder";
import { FINANCIAL_STORY_SNAPSHOT_VERSION } from "./FinancialStorySnapshot";

/**
 * Concrete implementation of IStoryEngine.
 *
 * StoryEngine knows nothing about individual generators — it delegates
 * entirely to StoryRegistry for block production and StoryBuilder for
 * assembly. Adding a new generator never requires touching this class.
 *
 * Instantiate via createDefaultStoryEngine() from StoryFactory.ts, or build
 * a custom engine with a subset of generators for testing.
 */
export class StoryEngine implements IStoryEngine {
  private readonly builder = new StoryBuilder();

  constructor(private readonly registry: StoryRegistry) {}

  generate(input: StoryEngineInput): FinancialStorySnapshot {
    const allBlocks: StoryBlock[] = [];
    const failures: StoryGenerationFailure[] = [];
    let generatorsRun = 0;

    for (const generator of this.registry.getAll()) {
      generatorsRun++;
      try {
        const produced = generator.generate(input);
        allBlocks.push(...produced);
      } catch (err) {
        failures.push({
          generatorName: generator.definition().name,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    const stories = this.builder.build(allBlocks, input);

    const metadata: StoryMetadata = {
      userId: input.aggregate.userId,
      generatedAt: new Date(),
      aggregatedAt: input.aggregate.aggregatedAt,
      metricsGeneratedAt: input.metricsSnapshot.metadata.generatedAt,
      analyticsAnalyzedAt: input.analyticsSnapshot.metadata.analyzedAt,
      insightsGeneratedAt: input.insightSnapshot.generatedAt,
      recommendationsGeneratedAt: input.recommendationSnapshot.metadata.generatedAt,
      generatorsRun,
      generatorFailures: failures.length,
      totalStories: stories.length,
      totalBlocks: allBlocks.length,
    };

    return Object.freeze({
      userId: input.aggregate.userId,
      generatedAt: metadata.generatedAt,
      snapshotVersion: FINANCIAL_STORY_SNAPSHOT_VERSION,
      stories,
      failures: Object.freeze(failures),
      metadata: Object.freeze(metadata),
    });
  }

  registeredGenerators(): ReadonlyArray<StoryBlockGeneratorType> {
    return this.registry.getDefinitions().map((d) => d.id);
  }
}
