import { describe, it, expect } from "vitest";
import { FinancialMemoryService } from "../FinancialMemoryService";
import { DefaultMemoryIndexer } from "../DefaultMemoryIndexer";
import { InMemoryMemoryStore } from "../InMemoryMemoryStore";
import { NullEmbeddingProvider } from "../NullEmbeddingProvider";
import { MemoryEntryType } from "../MemoryEntry";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { makeFinancialInsight, makeFinancialInsightSnapshot, makeFinancialStorySnapshot, makeStoryBlock } from "./testHelpers";

function makeService(): FinancialMemoryService {
  return new FinancialMemoryService(new InMemoryMemoryStore(), new DefaultMemoryIndexer(), new NullEmbeddingProvider());
}

describe("FinancialMemoryService — storeInsights (EC-012 fix)", () => {
  it("stores a real FinancialInsightSnapshot end-to-end and returns persisted entries", async () => {
    const service = makeService();
    const snapshot = makeFinancialInsightSnapshot("u1", [
      makeFinancialInsight("i1", InsightMetricCategory.SAVINGS, InsightType.RISK),
    ]);

    const stored = await service.storeInsights("u1", snapshot);

    expect(stored.length).toBe(1);
    expect(stored[0]!.type).toBe(MemoryEntryType.INSIGHT);
    expect(stored[0]!.id).toBeDefined();
    expect(stored[0]!.createdAt).toBeInstanceOf(Date);

    const all = await service.getAll("u1");
    expect(all.length).toBe(1);
  });
});

describe("FinancialMemoryService — storeStory (EC-012 new)", () => {
  it("stores a FinancialStorySnapshot end-to-end and is retrievable via getAll", async () => {
    const service = makeService();
    const snapshot = makeFinancialStorySnapshot("u1", [makeStoryBlock()]);

    const stored = await service.storeStory("u1", snapshot);

    expect(stored.length).toBe(1);
    expect(stored[0]!.type).toBe(MemoryEntryType.STORY_BLOCK);

    const filtered = await service.getAll("u1", [MemoryEntryType.STORY_BLOCK]);
    expect(filtered.length).toBe(1);
  });

  it("stores nothing for an empty story snapshot", async () => {
    const service = makeService();
    const snapshot = makeFinancialStorySnapshot("u1", []);

    const stored = await service.storeStory("u1", snapshot);
    expect(stored).toEqual([]);
  });

  it("assembleContext includes story entries in contextText", async () => {
    const service = makeService();
    const snapshot = makeFinancialStorySnapshot("u1", [makeStoryBlock({ title: "Largest Expense This Month" })]);
    await service.storeStory("u1", snapshot);

    const context = await service.assembleContext("u1", "what did I spend the most on");
    expect(context.contextText).toContain("Largest Expense This Month");
  });
});
