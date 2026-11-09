import type { MetricType } from "./MetricType";
import type { MetricDefinition } from "./MetricDefinition";
import type { MetricResult } from "./MetricResult";
import type { AggregateRequirement } from "./AggregateRequirement";
import type { FinancialAggregate } from "../aggregation/FinancialAggregate";

/**
 * The plugin contract every metric calculator must implement.
 *
 * Adding a new metric to the platform requires:
 *   1. Create a class implementing MetricCalculator.
 *   2. Register it with MetricRegistry.
 *   3. No changes to MetricsEngine.
 *
 * Each calculator owns exactly one metric type and has single responsibility.
 *
 * Invariants:
 *   - calculate() is pure and deterministic for the same aggregate input.
 *   - calculate() never modifies the aggregate.
 *   - calculate() never accesses repositories, databases, or external services.
 *   - calculate() never calls AI services or generates text.
 */
export interface MetricCalculator {
  /** Static metadata describing this metric. */
  definition(): MetricDefinition;

  /** Returns true if this calculator handles the given MetricType. */
  supports(type: MetricType): boolean;

  /**
   * Declares which parts of the FinancialAggregate this calculator reads.
   * Used for documentation, test setup, and future partial-aggregate optimisation.
   */
  requiredData(): ReadonlyArray<AggregateRequirement>;

  /**
   * Performs the calculation and returns an immutable MetricResult.
   * The only input is the FinancialAggregate — no other arguments, no side effects.
   */
  calculate(aggregate: FinancialAggregate): MetricResult;
}
