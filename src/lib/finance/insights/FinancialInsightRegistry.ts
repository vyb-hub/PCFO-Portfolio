import type { IInsightGenerator } from "./IInsightGenerator";
import type { FinancialInsightGeneratorType } from "./FinancialInsightGeneratorType";
import type { FinancialInsightGeneratorDefinition } from "./FinancialInsightGeneratorDefinition";

/**
 * Holds the set of active IInsightGenerator plugins.
 * Generators are keyed by FinancialInsightGeneratorType — at most one per type.
 *
 * Distinct from the legacy InsightRegistry (holds analytics-pipeline generators).
 */
export class FinancialInsightRegistry {
  private readonly generators = new Map<FinancialInsightGeneratorType, IInsightGenerator>();

  register(generator: IInsightGenerator): void {
    this.generators.set(generator.definition().id, generator);
  }

  has(id: FinancialInsightGeneratorType): boolean {
    return this.generators.has(id);
  }

  size(): number {
    return this.generators.size;
  }

  getAll(): ReadonlyArray<IInsightGenerator> {
    return [...this.generators.values()];
  }

  getDefinitions(): ReadonlyArray<FinancialInsightGeneratorDefinition> {
    return this.getAll().map(g => g.definition());
  }

  registeredIds(): ReadonlyArray<FinancialInsightGeneratorType> {
    return [...this.generators.keys()];
  }
}
