import type { ConversationIntent } from "./ConversationIntent";

/**
 * Resolves raw user input into a ConversationIntent.
 *
 * Deterministic — no LLM is called (same discipline as
 * coach/intent/IntentDetector, applied to a different, command-shaped
 * vocabulary — see ConversationIntentType's doc comment for why the two
 * aren't the same thing).
 */
export interface IConversationIntentResolver {
  /** Resolve a slash command or free-text message (e.g. from a Telegram message.text). */
  resolve(rawInput: string): ConversationIntent;

  /** Resolve an inline-button callback payload (e.g. Telegram callback_query.data), format "TYPE" or "TYPE:id". */
  resolveCallback(callbackData: string): ConversationIntent;
}
