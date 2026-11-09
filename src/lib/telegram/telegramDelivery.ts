import {
  TelegramAdapter,
  ConversationHistory,
  ConversationChannelType,
  ConversationDeliveryService,
} from "@/lib/finance/conversation";
import {
  FinancialMemoryService,
  DefaultMemoryIndexer,
  InMemoryMemoryStore,
  NullEmbeddingProvider,
} from "@/lib/finance/memory";

// Module-scope singleton — shared by every route that needs conversation
// history (the Telegram webhook route, and the financial-months/* routes
// that send proactive notifications via FinancialClosingNotifier), so a
// single warm instance's history isn't fragmented across separately
// constructed stores. No cross-instance persistence yet (no
// PgVectorMemoryStore) — pre-existing Memory Platform limitation, unchanged
// by this milestone. See ADR-020/ADR-021.
let memoryService: FinancialMemoryService | null = null;
export function getMemoryService(): FinancialMemoryService {
  if (!memoryService) {
    memoryService = new FinancialMemoryService(
      new InMemoryMemoryStore(),
      new DefaultMemoryIndexer(),
      new NullEmbeddingProvider(),
    );
  }
  return memoryService;
}

/**
 * Reads TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID directly — this IS the
 * composition boundary (conversation/ itself never reads process.env; see
 * TelegramAdapter's constructor-injection discipline). Returns null if not
 * configured; callers must skip sending rather than fail — a missing
 * Telegram config must never block a Financial Closing state change.
 */
export function createDefaultTelegramDelivery(): ConversationDeliveryService | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return null;

  const adapter = new TelegramAdapter(botToken);
  const history = new ConversationHistory(getMemoryService());
  return new ConversationDeliveryService(adapter, history, ConversationChannelType.TELEGRAM, chatId);
}
