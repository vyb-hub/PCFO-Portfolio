import type { ConversationResponse } from "./ConversationResponse";
import type { IConversationAdapter } from "./IConversationAdapter";
import type { ConversationHistory } from "./ConversationHistory";
import type { ConversationChannelType } from "./ConversationChannelType";

/**
 * Record + send — the shared tail end of conversation delivery.
 *
 * Extracted from the Telegram webhook route's previously-inline
 * adapter.send()/history.record() calls (EC-012) so the same record+send
 * path serves both the reactive command path (webhook route) and Financial
 * Closing's proactive event path (FinancialClosingNotifier, EC-013) — one
 * implementation of "how a finished response reaches a user," not two.
 *
 * Takes an already-composed ConversationResponse (via
 * composeConversationResponse) — it never needs to know whether the response
 * came from a resolved command or a mapped domain event.
 *
 * channel/target are constructor-injected, never read from process.env
 * directly (same discipline as TelegramAdapter's botToken). Single
 * configured chat id per the existing chat-linking simplification (ADR-020)
 * — no target-resolution abstraction until there's more than one chat to
 * resolve to.
 */
export class ConversationDeliveryService {
  constructor(
    private readonly adapter: IConversationAdapter,
    private readonly history: ConversationHistory,
    private readonly channel: ConversationChannelType,
    private readonly target: string,
  ) {}

  async send(response: ConversationResponse, rawInputLabel: string): Promise<void> {
    await this.adapter.send(this.target, {
      title: response.title,
      text: response.text,
      quickReplies: response.quickReplies,
    });

    await this.history.record(response.userId, rawInputLabel, response.text, this.channel);
  }
}
