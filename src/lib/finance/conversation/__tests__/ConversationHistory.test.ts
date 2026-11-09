import { describe, it, expect, vi } from "vitest";
import { ConversationHistory } from "../ConversationHistory";
import { ConversationChannelType } from "../ConversationChannelType";
import { MemoryEntryType } from "../../memory/MemoryEntry";
import type { IFinancialMemoryService } from "../../memory/IFinancialMemoryService";

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
    getAll: vi.fn().mockResolvedValue([{ id: "e1" }, { id: "e2" }]),
  } as unknown as IFinancialMemoryService;
}

describe("ConversationHistory — delegates to IFinancialMemoryService, never maintains its own state", () => {
  it("record() calls storeConversationNote with a channel tag", async () => {
    const memoryService = fakeMemoryService();
    const history = new ConversationHistory(memoryService);

    await history.record("u1", "what's my biggest expense", "It's $500 to Amazon.", ConversationChannelType.TELEGRAM);

    expect(memoryService.storeConversationNote).toHaveBeenCalledWith(
      "u1",
      expect.stringContaining("what's my biggest expense"),
      ["channel:telegram"],
    );
  });

  it("recent() calls getAll filtered to CONVERSATION_NOTE and applies the limit", async () => {
    const memoryService = fakeMemoryService();
    const history = new ConversationHistory(memoryService);

    const entries = await history.recent("u1", 1);

    expect(memoryService.getAll).toHaveBeenCalledWith("u1", [MemoryEntryType.CONVERSATION_NOTE]);
    expect(entries.length).toBe(1);
  });
});
