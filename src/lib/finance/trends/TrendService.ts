import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { ITrendService } from "./ITrendService";
import type { ITrendEngine } from "./ITrendEngine";
import type { TrendReport } from "./TrendReport";
import type { TrendComparison } from "./TrendComparison";
import { buildTrendComparison } from "./TrendComparison";

/**
 * Thin orchestration layer over ITrendEngine.
 * Validates inputs, delegates to the engine, and builds TrendComparisons.
 */
export class TrendService implements ITrendService {
  constructor(private readonly engine: ITrendEngine) {}

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): TrendReport {
    if (snapshots.length === 0) {
      throw new Error("TrendService.analyze: at least one snapshot is required");
    }
    return this.engine.analyze(snapshots);
  }

  compare(baseline: TrendReport, current: TrendReport): ReadonlyArray<TrendComparison> {
    if (baseline.userId !== current.userId) {
      throw new Error(
        "TrendService.compare: userId mismatch between baseline and current reports",
      );
    }

    const comparisons: TrendComparison[] = [];
    for (const currentTrend of current.trends) {
      const baselineTrend = baseline.trends.find(
        (t) => t.metricType === currentTrend.metricType,
      );
      if (baselineTrend) {
        comparisons.push(buildTrendComparison(baselineTrend, currentTrend));
      }
    }
    return comparisons;
  }
}
