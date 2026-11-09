import type { FinancialInsightSnapshot } from "./FinancialInsightSnapshot";
import type { FinancialInsightGeneratorType } from "./FinancialInsightGeneratorType";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";

/**
 * Orchestrates the registered IInsightGenerator plugins and assembles
 * a FinancialInsightSnapshot.
 *
 * Distinct from the legacy IInsightEngine (takes AnalyticsSnapshot).
 */
export interface IFinancialInsightEngine {
  generate(
    snapshot: FinancialMetricsSnapshot,
    report: TrendReport,
  ): FinancialInsightSnapshot;
  registeredGenerators(): ReadonlyArray<FinancialInsightGeneratorType>;
}
