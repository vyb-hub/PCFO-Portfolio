import { describe, it, expect } from "vitest";
import { DefaultMemoryIndexer } from "../DefaultMemoryIndexer";
import { FinancialSnapshotType } from "../FinancialMemoryEntry";
import { MemoryEntryType } from "../MemoryEntry";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import { InsightType } from "../../insights/InsightType";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { StoryPriority } from "../../story/StoryPriority";
import {
  makeFinancialInsight,
  makeFinancialInsightSnapshot,
  makeFinancialStorySnapshot,
  makeStoryBlock,
} from "./testHelpers";

describe("DefaultMemoryIndexer — indexInsights (EC-012 type-correctness fix)", () => {
  const indexer = new DefaultMemoryIndexer();

  it("accepts a real FinancialInsightSnapshot and produces one entry per insight", () => {
    const insights = [
      makeFinancialInsight("i1", InsightMetricCategory.SAVINGS, InsightType.RISK),
      makeFinancialInsight("i2", InsightMetricCategory.DEBT, InsightType.POSITIVE),
    ];
    const snapshot = makeFinancialInsightSnapshot("u1", insights);

    const drafts = indexer.indexInsights("u1", snapshot);

    expect(drafts.length).toBe(2);
    expect(drafts[0]!.type).toBe(MemoryEntryType.INSIGHT);
    expect(drafts[0]!.snapshotType).toBe(FinancialSnapshotType.INSIGHTS);
    expect(drafts[0]!.sourceSnapshotId).toBe("i1");
  });

  it("content includes title, summary, details, and numeric confidence as a percentage", () => {
    const insight = makeFinancialInsight(
      "i1", InsightMetricCategory.SAVINGS, InsightType.RISK, InsightSeverityLevel.HIGH, 0.82,
      undefined,
      { title: "Savings rate is low", summary: "Dropped below threshold.", details: "4% vs 10% minimum." },
    );
    const snapshot = makeFinancialInsightSnapshot("u1", [insight]);

    const [draft] = indexer.indexInsights("u1", snapshot);

    expect(draft!.content).toContain("Savings rate is low");
    expect(draft!.content).toContain("Dropped below threshold.");
    expect(draft!.content).toContain("4% vs 10% minimum.");
    expect(draft!.content).toContain("82%");
  });

  it("tags severity, type, category, and a bucketed confidence tier (not a raw string confidence)", () => {
    const insight = makeFinancialInsight(
      "i1", InsightMetricCategory.SAVINGS, InsightType.RISK, InsightSeverityLevel.CRITICAL, 0.9,
    );
    const snapshot = makeFinancialInsightSnapshot("u1", [insight]);

    const [draft] = indexer.indexInsights("u1", snapshot);

    expect(draft!.tags).toContain("severity:critical");
    expect(draft!.tags).toContain("confidence:high");
  });

  it("returns an empty array for an empty snapshot", () => {
    const snapshot = makeFinancialInsightSnapshot("u1", []);
    expect(indexer.indexInsights("u1", snapshot)).toEqual([]);
  });
});

describe("DefaultMemoryIndexer — indexStory (EC-012 new capability)", () => {
  const indexer = new DefaultMemoryIndexer();

  it("produces one entry per StoryBlock across all stories", () => {
    const blocks = [makeStoryBlock({ id: "b1" })];
    const snapshot = makeFinancialStorySnapshot("u1", blocks);

    const drafts = indexer.indexStory("u1", snapshot);

    expect(drafts.length).toBe(1);
    expect(drafts[0]!.type).toBe(MemoryEntryType.STORY_BLOCK);
    expect(drafts[0]!.snapshotType).toBe(FinancialSnapshotType.STORY);
    expect(drafts[0]!.sourceSnapshotId).toBe("b1");
  });

  it("content includes title, summary, explanation, and userImpact", () => {
    const block = makeStoryBlock({
      title: "Largest Expense This Month",
      summary: "₹18,500 to Amazon.",
      explanation: "40% of spend.",
      userImpact: "Worth a look.",
    });
    const snapshot = makeFinancialStorySnapshot("u1", [block]);

    const [draft] = indexer.indexStory("u1", snapshot);

    expect(draft!.content).toContain("Largest Expense This Month");
    expect(draft!.content).toContain("₹18,500 to Amazon.");
    expect(draft!.content).toContain("40% of spend.");
    expect(draft!.content).toContain("Worth a look.");
  });

  it("tags priority, blockType, category, and confidence", () => {
    const block = makeStoryBlock({ priority: StoryPriority.HIGH });
    const snapshot = makeFinancialStorySnapshot("u1", [block]);

    const [draft] = indexer.indexStory("u1", snapshot);

    expect(draft!.tags).toContain("priority:high");
    expect(draft!.tags).toContain("blocktype:largest_expense");
    expect(draft!.tags).toContain("category:cash_flow");
  });

  it("returns an empty array when there are no stories", () => {
    const snapshot = makeFinancialStorySnapshot("u1", []);
    expect(indexer.indexStory("u1", snapshot)).toEqual([]);
  });
});
