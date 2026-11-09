import { describe, it, expect } from "vitest";
import { StoryBuilder } from "../StoryBuilder";
import { StoryCategory } from "../StoryCategory";
import { StoryPriority } from "../StoryPriority";
import { makeStoryBlock, makeStoryEngineInput } from "./testHelpers";

describe("StoryBuilder — build()", () => {
  const builder = new StoryBuilder();
  const input = makeStoryEngineInput("u1", []);

  it("returns no stories when there are no blocks", () => {
    expect(builder.build([], input)).toEqual([]);
  });

  it("groups blocks by category into separate FinancialStory containers", () => {
    const blocks = [
      makeStoryBlock({ id: "a", category: StoryCategory.CASH_FLOW }),
      makeStoryBlock({ id: "b", category: StoryCategory.SAVINGS }),
      makeStoryBlock({ id: "c", category: StoryCategory.CASH_FLOW }),
    ];

    const stories = builder.build(blocks, input);
    expect(stories.length).toBe(2);

    const cashFlow = stories.find((s) => s.category === StoryCategory.CASH_FLOW)!;
    expect(cashFlow.blocks.map((b) => b.id).sort()).toEqual(["a", "c"]);
    expect(cashFlow.title).toBe("Cash Flow");

    const savings = stories.find((s) => s.category === StoryCategory.SAVINGS)!;
    expect(savings.blocks.map((b) => b.id)).toEqual(["b"]);
  });

  it("sorts blocks within a story CRITICAL -> HIGH -> MEDIUM -> LOW", () => {
    const blocks = [
      makeStoryBlock({ id: "low", priority: StoryPriority.LOW }),
      makeStoryBlock({ id: "critical", priority: StoryPriority.CRITICAL }),
      makeStoryBlock({ id: "medium", priority: StoryPriority.MEDIUM }),
      makeStoryBlock({ id: "high", priority: StoryPriority.HIGH }),
    ];

    const stories = builder.build(blocks, input);
    expect(stories[0]!.blocks.map((b) => b.id)).toEqual(["critical", "high", "medium", "low"]);
  });

  it("carries userId and period from the input aggregate", () => {
    const stories = builder.build([makeStoryBlock()], input);
    expect(stories[0]!.userId).toBe(input.aggregate.userId);
    expect(stories[0]!.period).toBe(input.aggregate.period);
  });

  it("freezes the stories array, each story, and each blocks array", () => {
    const stories = builder.build([makeStoryBlock()], input);
    expect(Object.isFrozen(stories)).toBe(true);
    expect(Object.isFrozen(stories[0])).toBe(true);
    expect(Object.isFrozen(stories[0]!.blocks)).toBe(true);
  });
});
