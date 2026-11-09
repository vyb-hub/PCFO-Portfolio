import type { StoryEngineInput } from "./StoryEngineInput";
import type { StoryBlock } from "./StoryBlock";
import type { StoryBlockGeneratorDefinition } from "./StoryBlockGeneratorDefinition";

/**
 * Plugin interface for story block generation.
 *
 * Each IStoryBlockGenerator focuses on one narrow, nameable observation
 * (e.g. "the largest expense this month") within one StoryCategory, and
 * produces zero or more StoryBlocks from StoryEngineInput.
 *
 * Contract:
 *   - Receive the full StoryEngineInput. Never access repositories or call
 *     an LLM — consume only snapshot/aggregate data already computed upstream.
 *   - Return a ReadonlyArray<StoryBlock>. May be empty.
 *   - Must be pure and synchronous — no I/O, no AI calls, no Date.now()/Math.random()
 *     in the narrative logic itself (StoryBlock.generatedAt is the one exception).
 *   - Must not calculate financial metrics — narrate evidence, don't produce it.
 *     Small pure fact-finders (e.g. LargestExpenseFinder) that only read
 *     already-materialized values off FinancialAggregate are the sanctioned
 *     exception; see ADR-019 Decision 4.
 *   - Must not throw — StoryEngine isolates failures per generator regardless,
 *     but a well-behaved generator returns an empty array when nothing applies.
 *
 * Registration:
 *   StoryRegistry.register(new CashFlowLargestExpenseGenerator())
 *
 * Wiring:
 *   createDefaultStoryRegistry() in generators/index.ts is the sole place
 *   where concrete generators are named. StoryEngine never names them.
 */
export interface IStoryBlockGenerator {
  definition(): StoryBlockGeneratorDefinition;
  generate(input: StoryEngineInput): ReadonlyArray<StoryBlock>;
}
