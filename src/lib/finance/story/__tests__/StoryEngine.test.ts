import { describe, it, expect } from "vitest";
import { StoryEngine } from "../StoryEngine";
import { StoryRegistry } from "../StoryRegistry";
import { StoryCategory } from "../StoryCategory";
import { StoryBlockGeneratorType } from "../StoryBlockGeneratorType";
import type { IStoryBlockGenerator } from "../IStoryBlockGenerator";
import type { StoryBlockGeneratorDefinition } from "../StoryBlockGeneratorDefinition";
import type { StoryEngineInput } from "../StoryEngineInput";
import type { StoryBlock } from "../StoryBlock";
import { makeStoryBlock, makeStoryEngineInput } from "./testHelpers";

class StubGenerator implements IStoryBlockGenerator {
  constructor(
    private readonly id: StoryBlockGeneratorType,
    private readonly blocks: ReadonlyArray<StoryBlock>,
  ) {}
  definition(): StoryBlockGeneratorDefinition {
    return { id: this.id, category: StoryCategory.CASH_FLOW, name: this.id, description: "stub", version: "1.0.0" };
  }
  generate(): ReadonlyArray<StoryBlock> {
    return this.blocks;
  }
}

class ThrowingGenerator implements IStoryBlockGenerator {
  definition(): StoryBlockGeneratorDefinition {
    return {
      id: StoryBlockGeneratorType.CASH_FLOW_LARGEST_EXPENSE,
      category: StoryCategory.CASH_FLOW,
      name: "throwing-generator",
      description: "always throws",
      version: "1.0.0",
    };
  }
  generate(_input: StoryEngineInput): ReadonlyArray<StoryBlock> {
    throw new Error("boom");
  }
}

describe("StoryEngine — generate()", () => {
  const input = makeStoryEngineInput("u1", []);

  it("returns an empty snapshot when the registry is empty", () => {
    const engine = new StoryEngine(new StoryRegistry());
    const snapshot = engine.generate(input);

    expect(snapshot.stories).toEqual([]);
    expect(snapshot.failures).toEqual([]);
    expect(snapshot.metadata.generatorsRun).toBe(0);
    expect(snapshot.userId).toBe("u1");
  });

  it("collects blocks from every registered generator into stories", () => {
    const registry = new StoryRegistry()
      .register(new StubGenerator(StoryBlockGeneratorType.CASH_FLOW_LARGEST_EXPENSE, [makeStoryBlock({ id: "a" })]));
    const engine = new StoryEngine(registry);

    const snapshot = engine.generate(input);
    expect(snapshot.metadata.totalBlocks).toBe(1);
    expect(snapshot.stories.length).toBe(1);
    expect(snapshot.stories[0]!.blocks[0]!.id).toBe("a");
  });

  it("isolates a throwing generator without aborting the run", () => {
    const registry = new StoryRegistry()
      .register(new ThrowingGenerator());
    const engine = new StoryEngine(registry);

    const snapshot = engine.generate(input);
    expect(snapshot.failures.length).toBe(1);
    expect(snapshot.failures[0]!.generatorName).toBe("throwing-generator");
    expect(snapshot.stories).toEqual([]);
    expect(snapshot.metadata.generatorFailures).toBe(1);
  });

  it("registeredGenerators() reflects the wired registry", () => {
    const registry = new StoryRegistry()
      .register(new StubGenerator(StoryBlockGeneratorType.CASH_FLOW_LARGEST_EXPENSE, []));
    const engine = new StoryEngine(registry);
    expect(engine.registeredGenerators()).toEqual([StoryBlockGeneratorType.CASH_FLOW_LARGEST_EXPENSE]);
  });

  it("result is frozen", () => {
    const engine = new StoryEngine(new StoryRegistry());
    const snapshot = engine.generate(input);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.metadata)).toBe(true);
  });
});
