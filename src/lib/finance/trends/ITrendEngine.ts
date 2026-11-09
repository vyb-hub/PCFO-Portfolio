import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "./TrendReport";

/**
 * Pure trend analysis engine.
 * Takes an ordered set of snapshots and returns an immutable TrendReport.
 */
export interface ITrendEngine {
  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): TrendReport;
}
