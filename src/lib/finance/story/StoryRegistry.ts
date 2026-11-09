import type { IStoryBlockGenerator } from "./IStoryBlockGenerator";
import type { StoryBlockGeneratorDefinition } from "./StoryBlockGeneratorDefinition";
import type { StoryBlockGeneratorType } from "./StoryBlockGeneratorType";

/**
 * Holds all registered IStoryBlockGenerators.
 *
 * StoryEngine delegates to this registry — it never names a concrete
 * generator. Adding a new generator: call register() once in
 * createDefaultStoryRegistry().
 */
export class StoryRegistry {
  private readonly generators = new Map<StoryBlockGeneratorType, IStoryBlockGenerator>();

  register(generator: IStoryBlockGenerator): this {
    this.generators.set(generator.definition().id, generator);
    return this;
  }

  get(id: StoryBlockGeneratorType): IStoryBlockGenerator | undefined {
    return this.generators.get(id);
  }

  has(id: StoryBlockGeneratorType): boolean {
    return this.generators.has(id);
  }

  getAll(): ReadonlyArray<IStoryBlockGenerator> {
    return Array.from(this.generators.values());
  }

  getDefinitions(): ReadonlyArray<StoryBlockGeneratorDefinition> {
    return this.getAll().map((g) => g.definition());
  }

  get size(): number {
    return this.generators.size;
  }
}
