import type { MetricType } from "../metrics/MetricType";
import type { StoryCategory } from "./StoryCategory";
import type { StoryBlockType } from "./StoryBlockType";
import type { StoryPriority } from "./StoryPriority";
import type { StoryConfidence } from "./StoryConfidence";
import type { StoryEvidence } from "./StoryEvidence";

/**
 * A single explainable unit of financial narrative.
 *
 * A StoryBlock answers the charter's four questions about one specific
 * observation:
 *   summary/explanation → what happened, why
 *   userImpact          → should I care?
 *   recommendedAction   → what should I do next?
 *
 * StoryBlocks are produced by IStoryBlockGenerator implementations and
 * assembled into a FinancialStory by StoryBuilder. They are immutable —
 * every array field is frozen at construction time (see StoryTemplates.ts).
 */
export interface StoryBlock {
  readonly id: string;
  readonly title: string;
  readonly category: StoryCategory;
  readonly blockType: StoryBlockType;
  readonly priority: StoryPriority;
  readonly confidence: StoryConfidence;
  /** One-line description suitable for a collapsed card. */
  readonly summary: string;
  /** Full explanation of why this happened. */
  readonly explanation: string;
  /** Why the user should (or should not) care about this. */
  readonly userImpact: string;
  /** What the user should consider doing next. Descriptive, not prescriptive advice. */
  readonly recommendedAction: string;
  readonly supportingMetrics: ReadonlyArray<MetricType>;
  readonly supportingInsights: ReadonlyArray<string>;
  readonly supportingRecommendations: ReadonlyArray<string>;
  readonly evidence: StoryEvidence;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly generatedAt: Date;
}
