import { describe, it, expect } from "vitest";
import { CashFlowLargestExpenseGenerator } from "../generators/CashFlowLargestExpenseGenerator";
import { StoryCategory } from "../StoryCategory";
import { StoryBlockType } from "../StoryBlockType";
import { StoryConfidence } from "../StoryConfidence";
import { StoryPriority } from "../StoryPriority";
import { makeStoryEngineInput, makeTransaction, money } from "./testHelpers";

describe("CashFlowLargestExpenseGenerator", () => {
  const generator = new CashFlowLargestExpenseGenerator();

  it("returns no blocks when there are no expense transactions", () => {
    const input = makeStoryEngineInput("u1", []);
    expect(generator.generate(input)).toEqual([]);
  });

  it("produces exactly one StoryBlock with the correct shape", () => {
    const txn = makeTransaction({ id: "t1", amount: money(18500), merchant: "Amazon", date: new Date("2026-06-14") });
    const input = makeStoryEngineInput("u1", [
      txn,
      makeTransaction({ id: "t2", amount: money(1500) }),
    ]);

    const blocks = generator.generate(input);
    expect(blocks.length).toBe(1);

    const block = blocks[0]!;
    expect(block.category).toBe(StoryCategory.CASH_FLOW);
    expect(block.blockType).toBe(StoryBlockType.LARGEST_EXPENSE);
    expect(block.confidence).toBe(StoryConfidence.HIGH);
    expect(block.title).toBe("Largest Expense This Month");
    expect(block.summary).toContain("Amazon");
    expect(block.summary).toContain("18,500");
    expect(block.evidence.supportingTransactionIds).toEqual(["t1"]);
    expect(block.supportingInsights).toEqual([]);
    expect(block.supportingRecommendations).toEqual([]);
    expect(Object.isFrozen(block)).toBe(true);
    expect(Object.isFrozen(block.evidence)).toBe(true);
  });

  it("assigns HIGH priority when the expense dominates total spend", () => {
    const input = makeStoryEngineInput("u1", [
      makeTransaction({ id: "big", amount: money(9000) }),
      makeTransaction({ id: "small", amount: money(1000) }),
    ]);
    const block = generator.generate(input)[0]!;
    expect(block.priority).toBe(StoryPriority.HIGH);
  });

  it("assigns LOW priority when the expense is a small share of total spend", () => {
    const transactions = [
      makeTransaction({ id: "big", amount: money(1000) }),
      ...Array.from({ length: 9 }, (_, i) => makeTransaction({ id: `t${i}`, amount: money(1000) })),
    ];
    const input = makeStoryEngineInput("u1", transactions);
    const block = generator.generate(input)[0]!;
    // largest is 1000 / total 10000 = 10% => LOW
    expect(block.priority).toBe(StoryPriority.LOW);
  });

  it("recommends checking recurrence when the transaction is recurring", () => {
    const input = makeStoryEngineInput("u1", [
      makeTransaction({ id: "t1", amount: money(5000), isRecurring: true }),
    ]);
    const block = generator.generate(input)[0]!;
    expect(block.recommendedAction).toContain("recurring");
  });

  it("is deterministic given identical input (aside from id/timestamps)", () => {
    const txn = makeTransaction({ id: "t1", amount: money(5000), merchant: "Store" });
    const input = makeStoryEngineInput("u1", [txn]);

    const a = generator.generate(input)[0]!;
    const b = generator.generate(input)[0]!;

    expect(a.summary).toBe(b.summary);
    expect(a.explanation).toBe(b.explanation);
    expect(a.userImpact).toBe(b.userImpact);
    expect(a.recommendedAction).toBe(b.recommendedAction);
    expect(a.priority).toBe(b.priority);
    expect(a.id).not.toBe(b.id);
  });
});
