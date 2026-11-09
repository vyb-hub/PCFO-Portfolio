import type { IConversationEngine } from "./IConversationEngine";
import { ConversationEngine } from "./ConversationEngine";
import { NullConversationResponder } from "./NullConversationResponder";

/**
 * Sole wiring point for the Conversation Engine.
 *
 * Swap NullConversationResponder for a real IConversationResponder here —
 * and only here — once a future milestone decides what powers AI rewriting.
 */
export function createDefaultConversationEngine(): IConversationEngine {
  return new ConversationEngine(new NullConversationResponder());
}
