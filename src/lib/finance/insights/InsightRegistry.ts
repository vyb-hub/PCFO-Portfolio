import type { InsightGenerator } from "./InsightGenerator";
import type { InsightGeneratorDefinition } from "./InsightGeneratorDefinition";
import type { InsightGeneratorType } from "./InsightGeneratorType";

/**
 * Holds all registered InsightGenerators.
 *
 * InsightEngine delegates to this registry — it never names a concrete generator.
 * Adding a new generator: call register() once in createDefaultInsightEngine().
 */
export class InsightRegistry {
  private readonly generators = new Map<InsightGeneratorType, InsightGenerator>();

  register(generator: InsightGenerator): this {
    this.generators.set(generator.definition().id, generator);
    return this;
  }

  get(id: InsightGeneratorType): InsightGenerator | undefined {
    return this.generators.get(id);
  }

  has(id: InsightGeneratorType): boolean {
    return this.generators.has(id);
  }

  getAll(): ReadonlyArray<InsightGenerator> {
    return Array.from(this.generators.values());
  }

  getDefinitions(): ReadonlyArray<InsightGeneratorDefinition> {
    return this.getAll().map((g) => g.definition());
  }

  get size(): number {
    return this.generators.size;
  }
}
