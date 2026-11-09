import type { FormattedMessage } from "./FormattedMessage";

/**
 * Port every channel adapter implements (Telegram now; WhatsApp, Email,
 * Voice, Slack, Push Notification, Web Chat, API reserved for later —
 * see ConversationChannelType).
 *
 * `target` is channel-specific (a Telegram chat id, an email address, a
 * phone number, ...) — this interface doesn't know or care what it means.
 * Implementations own all channel-specific rendering (Markdown escaping,
 * message chunking, inline buttons) from the channel-agnostic FormattedMessage.
 */
export interface IConversationAdapter {
  send(target: string, message: FormattedMessage): Promise<void>;
}
