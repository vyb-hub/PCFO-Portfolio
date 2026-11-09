import type { ConversationIntentType } from "./ConversationIntentType";

/** A drill-down button an adapter may render, e.g. a Telegram inline keyboard button. */
export interface ConversationQuickReply {
  readonly label: string;
  /** Consumed by IConversationIntentResolver.resolveCallback(), format "TYPE" or "TYPE:id". */
  readonly callbackData: string;
}

/**
 * Channel-agnostic rendering of a ConversationResponse.
 *
 * Plain prose — no Markdown, no HTML. Each IConversationAdapter is
 * responsible for its own channel-specific markup/escaping from this shape.
 */
export interface FormattedMessage {
  readonly title: string | null;
  readonly text: string;
  readonly quickReplies: ReadonlyArray<ConversationQuickReply>;
}

export function quickReply(label: string, intentType: ConversationIntentType, referencedId?: string): ConversationQuickReply {
  return { label, callbackData: referencedId ? `${intentType}:${referencedId}` : intentType };
}
