import type { IStoryEngine } from "./IStoryEngine";
import { StoryEngine } from "./StoryEngine";
import { createDefaultStoryRegistry } from "./generators";

/**
 * Sole wiring point for the Story Engine.
 *
 * This is the only place in the codebase where a concrete StoryEngine is
 * constructed from a concrete registry. Callers (e.g. PipelineFactory)
 * depend only on IStoryEngine.
 */
export function createDefaultStoryEngine(): IStoryEngine {
  return new StoryEngine(createDefaultStoryRegistry());
}
