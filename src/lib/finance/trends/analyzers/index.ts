import { DefaultMetricTrendAnalyzer } from "./DefaultMetricTrendAnalyzer";
import { TrendAnalyzerRegistry } from "../TrendAnalyzerRegistry";
import { TrendEngine } from "../TrendEngine";
import { TrendService } from "../TrendService";

export { DefaultMetricTrendAnalyzer };

/**
 * Creates a TrendEngine wired with the DefaultMetricTrendAnalyzer.
 * Override per-metric analyzers via registry.register() on the returned engine.
 */
export function createDefaultTrendEngine(): TrendEngine {
  const analyzer = new DefaultMetricTrendAnalyzer();
  const registry = new TrendAnalyzerRegistry(analyzer);
  return new TrendEngine(registry);
}

/**
 * Creates a TrendService backed by the default engine.
 * This is the recommended entry point for application code.
 */
export function createDefaultTrendService(): TrendService {
  return new TrendService(createDefaultTrendEngine());
}
