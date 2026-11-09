import type { MetricType } from "../metrics/MetricType";
import type { ITrendAnalyzer } from "./ITrendAnalyzer";

/**
 * Registry that maps MetricType → ITrendAnalyzer.
 * Falls back to the default analyzer for unregistered types.
 *
 * Use register() to plug in per-metric overrides (e.g. a custom seasonal
 * analyzer for SAVINGS_RATE). The default analyzer handles all other types.
 */
export class TrendAnalyzerRegistry {
  private readonly overrides = new Map<MetricType, ITrendAnalyzer>();

  constructor(private readonly defaultAnalyzer: ITrendAnalyzer) {}

  register(metricType: MetricType, analyzer: ITrendAnalyzer): void {
    this.overrides.set(metricType, analyzer);
  }

  get(metricType: MetricType): ITrendAnalyzer {
    return this.overrides.get(metricType) ?? this.defaultAnalyzer;
  }

  listOverrides(): ReadonlyMap<MetricType, ITrendAnalyzer> {
    return this.overrides;
  }
}
