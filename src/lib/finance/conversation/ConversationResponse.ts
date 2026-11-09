import type { ConversationIntentType } from "./ConversationIntentType";
import type { StoryEvidence } from "../story/StoryEvidence";
import type { ConversationQuickReply } from "./FormattedMessage";

/**
 * The channel-agnostic result of ConversationEngine.handle().
 *
 * title/text are plain prose — no markup. Each IConversationAdapter is
 * responsible for its own channel-specific rendering (Markdown escaping,
 * message chunking, inline buttons, etc.) from this shape; the engine and
 * this response type know nothing about any specific channel.
 */
export interface ConversationResponse {
  readonly id: string;
  readonly userId: string;
  readonly intentType: ConversationIntentType;
  readonly title: string | null;
  readonly text: string;
  readonly quickReplies: ReadonlyArray<ConversationQuickReply>;
  readonly evidence: StoryEvidence;
  readonly generatedAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}
