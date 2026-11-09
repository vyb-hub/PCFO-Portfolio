import type { InsightMetricCategory } from "./InsightMetricCategory";
import type { InsightSeverityLevel } from "./InsightSeverityLevel";

/**
 * Quantitative statistics about the insight generation run.
 */
export interface FinancialInsightStatistics {
  readonly metricsAnalyzed: number;
  readonly metricsWithTrends: number;
  readonly averageConfidence: number;
  /** Null when no insights were generated. */
  readonly highestSeverityFound: InsightSeverityLevel | null;
  readonly categoriesCovered: ReadonlyArray<InsightMetricCategory>;
}
