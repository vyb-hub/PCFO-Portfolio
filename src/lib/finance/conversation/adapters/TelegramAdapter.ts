import type { IConversationAdapter } from "../IConversationAdapter";
import type { FormattedMessage } from "../FormattedMessage";

const TELEGRAM_MESSAGE_LIMIT = 4096;

function chunk(text: string, size: number): ReadonlyArray<string> {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

/**
 * Real (not stubbed) implementation of IConversationAdapter for Telegram.
 *
 * Zero financial business logic — only channel rendering: plain text (no
 * Markdown, to avoid MarkdownV2's escaping requirements — a real correctness
 * risk for arbitrary generated prose that a formatting nicety doesn't
 * justify this milestone), inline-keyboard buttons from quickReplies, and
 * 4096-char message chunking.
 *
 * botToken is constructor-injected, never read from process.env directly —
 * same credential-injection discipline as coach/'s GeminiProvider/OpenAIProvider.
 */
export class TelegramAdapter implements IConversationAdapter {
  constructor(
    private readonly botToken: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async send(target: string, message: FormattedMessage): Promise<void> {
    const fullText = message.title ? `${message.title}\n\n${message.text}` : message.text;
    const parts = chunk(fullText, TELEGRAM_MESSAGE_LIMIT);

    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      await this.sendOne(target, parts[i] as string, isLast ? message.quickReplies : []);
    }
  }

  /**
   * Acknowledge a callback_query so Telegram stops showing a loading spinner
   * on the button the user tapped. Telegram-specific — deliberately not part
   * of IConversationAdapter, which knows nothing about inline-button
   * mechanics. Callers that know they're talking to Telegram specifically
   * (the webhook route) call this directly on the concrete adapter.
   */
  async answerCallback(callbackQueryId: string): Promise<void> {
    await this.fetchFn(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  }

  private async sendOne(
    chatId: string,
    text: string,
    quickReplies: FormattedMessage["quickReplies"],
  ): Promise<void> {
    const body: Record<string, unknown> = { chat_id: chatId, text };

    if (quickReplies.length > 0) {
      body.reply_markup = {
        inline_keyboard: quickReplies.map(r => [{ text: r.label, callback_data: r.callbackData }]),
      };
    }

    const res = await this.fetchFn(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`TelegramAdapter: sendMessage failed (${res.status}): ${errorBody}`);
    }
  }
}
