import type { IMetricsEngine } from "./IMetricsEngine";
import type { MetricType } from "./MetricType";
import type { MetricDefinition } from "./MetricDefinition";
import type { MetricResult, MetricEvaluation } from "./MetricResult";
import type { FinancialAggregate } from "../aggregation/FinancialAggregate";
import { MetricRegistry } from "./MetricRegistry";

export class MetricNotSupportedError extends Error {
  constructor(type: MetricType) {
    super(`No calculator registered for MetricType: ${type}`);
    this.name = "MetricNotSupportedError";
  }
}

/**
 * Concrete implementation of IMetricsEngine.
 *
 * MetricsEngine knows nothing about individual calculators — it delegates
 * entirely to MetricRegistry. Adding a new metric never requires touching
 * this class.
 *
 * Instantiate via createDefaultMetricsEngine() from calculators/index.ts,
 * or build a custom engine with a subset of calculators for testing.
 */
export class MetricsEngine implements IMetricsEngine {
  constructor(private readonly registry: MetricRegistry) {}

  compute(aggregate: FinancialAggregate, type: MetricType): MetricResult {
    const calculator = this.registry.get(type);
    if (!calculator) throw new MetricNotSupportedError(type);
    return calculator.calculate(aggregate);
  }

  computeAll(aggregate: FinancialAggregate): ReadonlyArray<MetricResult> {
    return this.registry.getAll().map((calc) => calc.calculate(aggregate));
  }

  computeMany(
    aggregate: FinancialAggregate,
    types: ReadonlyArray<MetricType>,
  ): ReadonlyArray<MetricResult> {
    return types.map((type) => this.compute(aggregate, type));
  }

  evaluate(aggregate: FinancialAggregate, type: MetricType): MetricEvaluation {
    const result = this.compute(aggregate, type);
    const { threshold } = result.definition;

    if (!threshold) {
      return {
        result,
        threshold: { min: null, max: null, optimal: null, description: "No threshold defined." },
        isHealthy: true,
        distanceFromThreshold: 0,
      };
    }

    const belowMin = threshold.min !== null && result.value < threshold.min;
    const aboveMax = threshold.max !== null && result.value > threshold.max;
    const isHealthy = !belowMin && !aboveMax;

    let distanceFromThreshold = 0;
    if (belowMin && threshold.min !== null) {
      distanceFromThreshold = result.value - threshold.min; // negative
    } else if (aboveMax && threshold.max !== null) {
      distanceFromThreshold = result.value - threshold.max; // positive
    }

    return { result, threshold, isHealthy, distanceFromThreshold };
  }

  isSupported(type: MetricType): boolean {
    return this.registry.has(type);
  }

  supportedTypes(): ReadonlyArray<MetricType> {
    return this.registry.supportedTypes();
  }

  definitions(): ReadonlyArray<MetricDefinition> {
    return this.registry.getDefinitions();
  }
}
