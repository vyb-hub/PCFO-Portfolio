import type { ConversationContext } from "./ConversationContext";
import type { FormattedMessage } from "./FormattedMessage";
import type { IConversationResponder } from "./IConversationResponder";

/** Pass-through: returns the deterministic draft unchanged. The only implementation shipped this milestone. */
export class NullConversationResponder implements IConversationResponder {
  async respond(_context: ConversationContext, draft: FormattedMessage): Promise<FormattedMessage> {
    return draft;
  }
}
