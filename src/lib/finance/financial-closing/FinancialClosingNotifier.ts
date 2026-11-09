import { composeConversationResponse, type ConversationDeliveryService } from "../conversation";
import type { IConversationResponder } from "../conversation/IConversationResponder";
import { ClosingConversationEventMapper } from "./ClosingConversationEventMapper";
import type { ClosingConversationEvent } from "./events/ClosingConversationEvent";

/**
 * event -> ClosingConversationEventMapper -> composeConversationResponse ->
 * ConversationDeliveryService.send(). The only way Financial Closing reaches
 * a user — never touches TelegramAdapter or an adapter target directly.
 *
 * `delivery` is null when Telegram isn't configured; notify() then no-ops.
 * A missing notification channel must never block a real state change
 * (confirmSalary/closeMonth succeed regardless), so failures here are
 * logged and swallowed, never rethrown.
 */
export class FinancialClosingNotifier {
  constructor(
    private readonly mapper: ClosingConversationEventMapper,
    private readonly responder: IConversationResponder,
    private readonly delivery: ConversationDeliveryService | null,
  ) {}

  async notify(event: ClosingConversationEvent): Promise<void> {
    if (!this.delivery) return;

    try {
      const { intentType, context } = this.mapper.toConversationContext(event);
      const rawInputLabel = `[system:${event.kind}]`;
      const response = await composeConversationResponse(
        context,
        { userId: event.userId, intentType, rawInput: rawInputLabel, confidence: 1 },
        this.responder,
      );
      await this.delivery.send(response, rawInputLabel);
    } catch (err) {
      console.error("[FinancialClosingNotifier] notify failed:", err instanceof Error ? err.message : err);
    }
  }
}
