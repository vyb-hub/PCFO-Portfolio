import type { FinancialInsightGeneratorType } from "./FinancialInsightGeneratorType";
import type { InsightMetricCategory } from "./InsightMetricCategory";
import type { MetricType } from "../metrics/MetricType";

/**
 * Static metadata that every IInsightGenerator must declare.
 * Drives API discovery and registry validation.
 */
export interface FinancialInsightGeneratorDefinition {
  readonly id: FinancialInsightGeneratorType;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly coveredCategories: ReadonlyArray<InsightMetricCategory>;
  readonly coveredMetrics: ReadonlyArray<MetricType>;
}
