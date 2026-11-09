import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "./TrendReport";
import type { TrendComparison } from "./TrendComparison";

/**
 * Public facade for the Trend Analysis platform.
 *
 * analyze()  — produce a TrendReport from a historical snapshot window.
 * compare()  — diff two TrendReports to surface acceleration, recovery, or deterioration.
 */
export interface ITrendService {
  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): TrendReport;
  compare(baseline: TrendReport, current: TrendReport): ReadonlyArray<TrendComparison>;
}
