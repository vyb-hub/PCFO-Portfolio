import { describe, it, expect, vi } from "vitest";
import { ConversationDeliveryService } from "../ConversationDeliveryService";
import { ConversationHistory } from "../ConversationHistory";
import { ConversationChannelType } from "../ConversationChannelType";
import { ConversationIntentType } from "../ConversationIntentType";
import { MemoryEntryType } from "../../memory/MemoryEntry";
import type { IConversationAdapter } from "../IConversationAdapter";
import type { IFinancialMemoryService } from "../../memory/IFinancialMemoryService";
import type { ConversationResponse } from "../ConversationResponse";
import { EMPTY_STORY_EVIDENCE } from "../../story/StoryEvidence";

function fakeAdapter(): IConversationAdapter {
  return { send: vi.fn() };
}

function fakeMemoryService(): IFinancialMemoryService {
  return {
    storeMetrics: vi.fn(),
    storeAnalytics: vi.fn(),
    storeInsights: vi.fn(),
    storeRecommendations: vi.fn(),
    storeStory: vi.fn(),
    storeConversationNote: vi.fn().mockResolvedValue({ id: "e1", type: MemoryEntryType.CONVERSATION_NOTE }),
    search: vi.fn(),
    assembleContext: vi.fn(),
    pruneExpired: vi.fn(),
    getAll: vi.fn(),
  } as unknown as IFinancialMemoryService;
}

function makeResponse(overrides: Partial<ConversationResponse> = {}): ConversationResponse {
  return {
    id: "r1",
    userId: "u1",
    intentType: ConversationIntentType.MONTH_CLOSED,
    title: "Month Closed",
    text: "2026-07 is closed.",
    quickReplies: [],
    evidence: EMPTY_STORY_EVIDENCE,
    generatedAt: new Date(),
    metadata: {},
    ...overrides,
  };
}

/** Record + send only — used by both the Telegram webhook route (reactive)
 * and FinancialClosingNotifier (proactive). Neither knows or cares how the
 * ConversationResponse it's handed was produced. */
describe("ConversationDeliveryService.send()", () => {
  it("sends via the adapter to the configured target, with title/text/quickReplies only", async () => {
    const adapter = fakeAdapter();
    const history = new ConversationHistory(fakeMemoryService());
    const delivery = new ConversationDeliveryService(adapter, history, ConversationChannelType.TELEGRAM, "chat-123");

    await delivery.send(makeResponse(), "[system:MONTH_CLOSED]");

    expect(adapter.send).toHaveBeenCalledWith("chat-123", {
      title: "Month Closed",
      text: "2026-07 is closed.",
      quickReplies: [],
    });
  });

  it("records the delivery to history with the given raw input label and channel", async () => {
    const memoryService = fakeMemoryService();
    const history = new ConversationHistory(memoryService);
    const delivery = new ConversationDeliveryService(fakeAdapter(), history, ConversationChannelType.TELEGRAM, "chat-123");

    await delivery.send(makeResponse(), "[system:MONTH_CLOSED]");

    expect(memoryService.storeConversationNote).toHaveBeenCalledWith(
      "u1",
      expect.stringContaining("[system:MONTH_CLOSED]"),
      ["channel:telegram"],
    );
  });
});
