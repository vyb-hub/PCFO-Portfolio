import type { ConversationContext } from "./ConversationContext";
import type { FormattedMessage } from "./FormattedMessage";

/**
 * The Conversation Platform's one AI extension seam (EC-012 architecture
 * decision — see ADR-020).
 *
 * ConversationEngine is 100% deterministic this milestone: it always calls
 * an IConversationResponder after formatting, but the shipped implementation
 * (NullConversationResponder) is a pass-through. A future implementation
 * could rewrite/summarize/personalize `draft` using an LLM — grounded in
 * `context`'s already-resolved evidence, never inventing new facts — without
 * ConversationEngine, ConversationContextBuilder, or ConversationFormatter
 * changing at all.
 *
 * Whether that future implementation wraps coach/'s existing (currently
 * inert) LLM plumbing, replaces it, or is something new entirely is an
 * explicit open question — not decided by this interface.
 */
export interface IConversationResponder {
  respond(context: ConversationContext, draft: FormattedMessage): Promise<FormattedMessage>;
}
