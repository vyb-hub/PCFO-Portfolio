import type { FinancialInsightSnapshot } from "./FinancialInsightSnapshot";
import type { FinancialInsight } from "./FinancialInsight";
import type { FinancialInsightSummary } from "./FinancialInsightSummary";
import type { InsightType } from "./InsightType";
import type { InsightSeverityLevel } from "./InsightSeverityLevel";
import type { InsightMetricCategory } from "./InsightMetricCategory";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";

/**
 * High-level service façade over IFinancialInsightEngine.
 * Provides generation plus querying helpers for insight consumers.
 */
export interface IFinancialInsightService {
  generate(
    snapshot: FinancialMetricsSnapshot,
    report: TrendReport,
  ): FinancialInsightSnapshot;

  summarise(snapshot: FinancialInsightSnapshot): FinancialInsightSummary;

  getByType(
    snapshot: FinancialInsightSnapshot,
    type: InsightType,
  ): ReadonlyArray<FinancialInsight>;

  getBySeverity(
    snapshot: FinancialInsightSnapshot,
    severity: InsightSeverityLevel,
  ): ReadonlyArray<FinancialInsight>;

  getByCategory(
    snapshot: FinancialInsightSnapshot,
    category: InsightMetricCategory,
  ): ReadonlyArray<FinancialInsight>;
}
