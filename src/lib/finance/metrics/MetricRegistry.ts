import type { MetricCalculator } from "./MetricCalculator";
import type { MetricDefinition } from "./MetricDefinition";
import type { MetricType } from "./MetricType";

/**
 * Registry of MetricCalculator implementations.
 *
 * MetricRegistry is the single point of knowledge about which calculators
 * are available. MetricsEngine depends only on this registry — it never
 * names a specific calculator.
 *
 * Usage:
 *   const registry = new MetricRegistry();
 *   registry.register(new SavingsRateCalculator());
 *   registry.register(new BurnRateCalculator());
 *
 * register() returns `this` for fluent chaining:
 *   registry
 *     .register(new SavingsRateCalculator())
 *     .register(new BurnRateCalculator());
 */
export class MetricRegistry {
  private readonly _calculators = new Map<MetricType, MetricCalculator>();

  /** Register a calculator. Overwrites any previously registered calculator for the same type. */
  register(calculator: MetricCalculator): this {
    const { id } = calculator.definition();
    this._calculators.set(id, calculator);
    return this;
  }

  get(type: MetricType): MetricCalculator | undefined {
    return this._calculators.get(type);
  }

  has(type: MetricType): boolean {
    return this._calculators.has(type);
  }

  /** All registered calculators, in registration order. */
  getAll(): ReadonlyArray<MetricCalculator> {
    return Array.from(this._calculators.values());
  }

  supportedTypes(): ReadonlyArray<MetricType> {
    return Array.from(this._calculators.keys());
  }

  /** Static definitions for all registered calculators, in registration order. */
  getDefinitions(): ReadonlyArray<MetricDefinition> {
    return Array.from(this._calculators.values()).map((c) => c.definition());
  }

  get size(): number {
    return this._calculators.size;
  }
}
