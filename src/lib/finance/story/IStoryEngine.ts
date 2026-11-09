// @depends-on: StoryEngineInput, FinancialStorySnapshot

import type { StoryEngineInput } from "./StoryEngineInput";
import type { FinancialStorySnapshot } from "./FinancialStorySnapshot";
import type { StoryBlockGeneratorType } from "./StoryBlockGeneratorType";

/**
 * Contract for the Story Engine.
 *
 * StoryEngine consumes StoryEngineInput and produces one FinancialStorySnapshot.
 * It knows nothing about individual generators — it delegates entirely to
 * StoryRegistry and StoryBuilder.
 *
 * Instantiate via createDefaultStoryEngine() from StoryFactory.ts.
 */
export interface IStoryEngine {
  generate(input: StoryEngineInput): FinancialStorySnapshot;
  registeredGenerators(): ReadonlyArray<StoryBlockGeneratorType>;
}
