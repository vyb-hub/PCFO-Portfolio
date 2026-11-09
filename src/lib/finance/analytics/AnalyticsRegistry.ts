import type { AnalyticsAnalyzer } from "./AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "./AnalyzerDefinition";
import type { AnalyzerType } from "./AnalyzerType";

/**
 * Registry of AnalyticsAnalyzer implementations.
 *
 * AnalyticsRegistry is the single source of knowledge about which analyzers
 * are available. AnalyticsEngine depends only on this registry — it never
 * names a specific analyzer.
 *
 * register() returns `this` for fluent chaining:
 *   registry
 *     .register(new TrendAnalyzer())
 *     .register(new VarianceAnalyzer());
 */
export class AnalyticsRegistry {
  private readonly _analyzers = new Map<AnalyzerType, AnalyticsAnalyzer>();

  /** Register an analyzer. Overwrites any previously registered analyzer for the same type. */
  register(analyzer: AnalyticsAnalyzer): this {
    const { id } = analyzer.definition();
    this._analyzers.set(id, analyzer);
    return this;
  }

  get(type: AnalyzerType): AnalyticsAnalyzer | undefined {
    return this._analyzers.get(type);
  }

  has(type: AnalyzerType): boolean {
    return this._analyzers.has(type);
  }

  /** All registered analyzers, in registration order. */
  getAll(): ReadonlyArray<AnalyticsAnalyzer> {
    return Array.from(this._analyzers.values());
  }

  /** Static definitions for all registered analyzers, in registration order. */
  getDefinitions(): ReadonlyArray<AnalyzerDefinition> {
    return Array.from(this._analyzers.values()).map((a) => a.definition());
  }

  get size(): number {
    return this._analyzers.size;
  }
}
