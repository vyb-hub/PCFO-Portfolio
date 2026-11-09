import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { createDefaultFinancialStateService } from "@/lib/finance/pipeline";
import {
  createDefaultConversationEngine,
  ConversationIntentResolver,
  ConversationHistory,
  ConversationChannelType,
  ConversationDeliveryService,
  TelegramAdapter,
} from "@/lib/finance/conversation";
import { getMemoryService } from "@/lib/telegram/telegramDelivery";

interface TelegramUpdate {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number } } };
}

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (configuredSecret) {
    const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== configuredSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedChatId = process.env.TELEGRAM_CHAT_ID;
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!botToken || !allowedChatId || !allowedEmail) {
    console.error("[telegram/webhook] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID/ALLOWED_EMAIL not configured");
    return NextResponse.json({ success: false, error: "Not configured" }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id ?? null;
  const rawInput = update.message?.text ?? update.callback_query?.data ?? null;

  // Silently ignore updates from any chat other than the one configured —
  // no TelegramLink model this milestone (see ADR-020's chat-linking
  // simplification). Always 200 so Telegram doesn't retry.
  if (chatId === null || rawInput === null || chatId.toString() !== allowedChatId) {
    return NextResponse.json({ success: true });
  }

  try {
    const user = await db.user.findFirst({ where: { email: allowedEmail } });
    if (!user) {
      console.error("[telegram/webhook] no user found for ALLOWED_EMAIL");
      return NextResponse.json({ success: true });
    }

    const resolver = new ConversationIntentResolver();
    const intent = update.callback_query
      ? resolver.resolveCallback(rawInput)
      : resolver.resolve(rawInput);

    const financialState = createDefaultFinancialStateService(db);
    const input = await financialState.getConversationInput(user.id);

    const engine = createDefaultConversationEngine();
    const response = await engine.handle(intent, input);

    const adapter = new TelegramAdapter(botToken);
    const history = new ConversationHistory(getMemoryService());
    const delivery = new ConversationDeliveryService(
      adapter,
      history,
      ConversationChannelType.TELEGRAM,
      chatId.toString(),
    );
    await delivery.send(response, rawInput);

    if (update.callback_query) {
      await adapter.answerCallback(update.callback_query.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[telegram/webhook] error:", message);
    // Still 200 — Telegram retries aggressively on non-2xx and there's
    // nothing useful a retry would fix for an error on our side.
    return NextResponse.json({ success: false, error: message });
  }
}
