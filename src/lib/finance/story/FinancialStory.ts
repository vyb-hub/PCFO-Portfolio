import type { AggregatePeriod } from "../aggregation/AggregatePeriod";
import type { StoryCategory } from "./StoryCategory";
import type { StoryBlock } from "./StoryBlock";

/**
 * A grouping of StoryBlocks that all belong to the same StoryCategory for a
 * single reporting period — e.g. the "Cash Flow Story" for June 2026.
 *
 * FinancialStory performs no interpretation of its own. It is a pure
 * container assembled by StoryBuilder from the blocks its generators
 * produced, sorted by StoryPriority.
 */
export interface FinancialStory {
  readonly id: string;
  readonly userId: string;
  readonly category: StoryCategory;
  readonly period: AggregatePeriod;
  /** Human-readable heading for the category, e.g. "Cash Flow". */
  readonly title: string;
  readonly blocks: ReadonlyArray<StoryBlock>;
  readonly generatedAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}
