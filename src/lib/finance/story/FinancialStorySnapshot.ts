import type { FinancialStory } from "./FinancialStory";
import type { StoryMetadata } from "./StoryMetadata";

export const FINANCIAL_STORY_SNAPSHOT_VERSION = "1.0.0" as const;

/**
 * A record of a single generator that threw during StoryEngine.generate().
 *
 * Captured failures do not abort the generation run — mirrors
 * RecommendationGenerationFailure / FinancialInsightGenerationFailure
 * failure-isolation idiom used by every upstream engine.
 */
export interface StoryGenerationFailure {
  readonly generatorName: string;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

/**
 * An immutable point-in-time record of every FinancialStory derived from one
 * StoryEngineInput.
 *
 * FinancialStorySnapshot is the official contract between the Story Engine
 * and all downstream consumers (Dashboard, Monthly/Weekly Reviews, Telegram
 * Copilot, AI Coach, Email/Push summaries). No consumer should reference
 * IStoryBlockGenerator implementations or StoryEngine directly.
 */
export interface FinancialStorySnapshot {
  readonly userId: string;
  readonly generatedAt: Date;
  readonly snapshotVersion: string;
  readonly stories: ReadonlyArray<FinancialStory>;
  readonly failures: ReadonlyArray<StoryGenerationFailure>;
  readonly metadata: StoryMetadata;
}
