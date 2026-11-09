import type { StoryBlockGeneratorType } from "./StoryBlockGeneratorType";
import type { StoryCategory } from "./StoryCategory";

/**
 * Static metadata describing an IStoryBlockGenerator.
 * Returned by IStoryBlockGenerator.definition().
 */
export interface StoryBlockGeneratorDefinition {
  readonly id: StoryBlockGeneratorType;
  readonly category: StoryCategory;
  readonly name: string;
  readonly description: string;
  readonly version: string;
}
