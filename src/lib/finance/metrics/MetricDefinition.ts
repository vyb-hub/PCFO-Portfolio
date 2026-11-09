import type { MetricType, MetricUnit, CalculationFrequency } from "./MetricType";
import type { MetricCategory } from "./MetricCategory";

/**
 * The healthy range for a metric.
 * Values are expressed in the same unit as the metric itself.
 *
 * null means "no bound" — e.g. net worth has no max.
 */
export interface MetricThreshold {
  /** Below this the metric is considered unhealthy. null = no lower bound. */
  readonly min: number | null;
  /** Above this the metric is considered unhealthy. null = no upper bound. */
  readonly max: number | null;
  /** The ideal target value. null = no single optimum. */
  readonly optimal: number | null;
  readonly description: string;
}

/**
 * Static metadata describing a metric type.
 *
 * MetricDefinition is calculator-owned and immutable. It powers:
 *   - UI generation (name, description, unit formatting)
 *   - API discovery (list all supported metrics + their semantics)
 *   - Health evaluation (threshold-based scoring in MetricEvaluation)
 *   - Scheduling (calculationFrequency)
 */
export interface MetricDefinition {
  readonly id: MetricType;
  readonly name: string;
  readonly description: string;
  readonly category: MetricCategory;
  readonly unit: MetricUnit;
  /** Semantic version of the calculation formula — bump when formula changes. */
  readonly version: string;
  readonly calculationFrequency: CalculationFrequency;
  /**
   * Healthy range constants. null means this metric has no universal threshold
   * (e.g. burn rate depends entirely on the user's income level).
   */
  readonly threshold: MetricThreshold | null;
}
