import type { ConversationIntent } from "./ConversationIntent";
import type { ConversationEngineInput } from "./ConversationEngineInput";
import type { ConversationResponse } from "./ConversationResponse";
import type { IConversationEngine } from "./IConversationEngine";
import type { IConversationResponder } from "./IConversationResponder";
import { ConversationContextBuilder } from "./ConversationContextBuilder";
import { composeConversationResponse } from "./ConversationResponseComposer";

/**
 * Concrete implementation of IConversationEngine.
 *
 * Single responsibility: interpret a resolved request into a conversation.
 * handle() sequence: ConversationContextBuilder selects the authoritative
 * source -> composeConversationResponse() does the rest (format -> AI
 * boundary -> freeze). That composition step is shared with Financial
 * Closing's proactive notification path (EC-013) — this engine is not, and
 * does not need to be aware of that; it still only ever handles a resolved
 * ConversationIntent. See ADR-021.
 */
export class ConversationEngine implements IConversationEngine {
  private readonly contextBuilder = new ConversationContextBuilder();

  constructor(private readonly responder: IConversationResponder) {}

  async handle(intent: ConversationIntent, input: ConversationEngineInput): Promise<ConversationResponse> {
    const context = this.contextBuilder.build(intent, input);
    return composeConversationResponse(
      context,
      {
        userId: input.userId,
        intentType: intent.type,
        rawInput: intent.rawInput,
        confidence: intent.confidence,
      },
      this.responder,
    );
  }
}
