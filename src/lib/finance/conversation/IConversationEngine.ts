import type { ConversationIntent } from "./ConversationIntent";
import type { ConversationEngineInput } from "./ConversationEngineInput";
import type { ConversationResponse } from "./ConversationResponse";

/**
 * Contract for the Conversation Engine.
 *
 * Resolves a ConversationContext, formats it, passes it through the
 * configured IConversationResponder, and returns a channel-agnostic
 * ConversationResponse. Does NOT send anything — sending is the caller's
 * job via an IConversationAdapter, keeping the engine itself channel-agnostic.
 */
export interface IConversationEngine {
  handle(intent: ConversationIntent, input: ConversationEngineInput): Promise<ConversationResponse>;
}
