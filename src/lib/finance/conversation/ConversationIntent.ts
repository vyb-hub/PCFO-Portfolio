import type { ConversationIntentType } from "./ConversationIntentType";

/**
 * A resolved conversation intent, produced by IConversationIntentResolver.
 *
 * referencedId carries the id argument for EXPLAIN_STORY/EXPLAIN_RECOMMENDATION —
 * a StoryBlock.id or Recommendation.id supplied via a slash-command argument
 * ("/explain <id>") or an inline-button callback ("EXPLAIN_STORY:<id>"). Null
 * when the intent doesn't need one.
 */
export interface ConversationIntent {
  readonly type: ConversationIntentType;
  readonly rawInput: string;
  readonly referencedId: string | null;
  /** 0.0-1.0. 1.0 for an exact command match; fractional for keyword-fallback matches. */
  readonly confidence: number;
  readonly matchedKeywords: ReadonlyArray<string>;
}
