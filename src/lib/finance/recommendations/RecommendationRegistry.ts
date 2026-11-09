import type { RecommendationGenerator } from "./RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "./RecommendationGeneratorDefinition";
import type { RecommendationGeneratorType } from "./RecommendationGeneratorType";

/**
 * Holds all registered RecommendationGenerators.
 *
 * RecommendationEngine delegates to this registry — it never names a concrete
 * generator. Adding a new generator: call register() once in
 * createDefaultRecommendationEngine().
 */
export class RecommendationRegistry {
  private readonly generators = new Map<RecommendationGeneratorType, RecommendationGenerator>();

  register(generator: RecommendationGenerator): this {
    this.generators.set(generator.definition().id, generator);
    return this;
  }

  get(id: RecommendationGeneratorType): RecommendationGenerator | undefined {
    return this.generators.get(id);
  }

  has(id: RecommendationGeneratorType): boolean {
    return this.generators.has(id);
  }

  getAll(): ReadonlyArray<RecommendationGenerator> {
    return Array.from(this.generators.values());
  }

  getDefinitions(): ReadonlyArray<RecommendationGeneratorDefinition> {
    return this.getAll().map((g) => g.definition());
  }

  get size(): number {
    return this.generators.size;
  }
}
