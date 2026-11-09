import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import { MetricType } from "../../metrics/MetricType";
import type { AnalyticsAnalyzer } from "../AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "../AnalyzerDefinition";
import type { AnalyticsFinding } from "../AnalyticsFinding";
import { AnalysisFindingType } from "../AnalysisFindingType";
import { AnalyzerType } from "../AnalyzerType";
import { TrendDirection } from "../TrendDirection";

/**
 * GoalProgressAnalyzer — observes wealth trajectory as a proxy for goal progression.
 *
 * The FinancialMetricsSnapshot does not carry explicit goal completion data.
 * NET_WORTH is the closest available metric for tracking wealth accumulation,
 * and SAVINGS_RATE indicates whether the user is on a path toward growth.
 *
 * This analyzer produces two observations:
 *   1. Net worth growth trajectory (growing, stable, or contracting).
 *   2. Whether savings rate provides a sustainable savings velocity
 *      (positive savings rate = active wealth building).
 */
export class GoalProgressAnalyzer implements AnalyticsAnalyzer {
  private static readonly DEFINITION: AnalyzerDefinition = {
    id: AnalyzerType.GOAL_PROGRESS,
    name: "Goal Progress Analyzer",
    description: "Observes net worth trajectory and savings velocity as proxies for goal progression.",
    version: "1.0",
    minimumSnapshots: 2,
  };

  definition(): AnalyzerDefinition {
    return GoalProgressAnalyzer.DEFINITION;
  }

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding> {
    const findings: AnalyticsFinding[] = [];

    // Net worth trajectory
    const netWorthSeries = this._extract(snapshots, MetricType.NET_WORTH);
    if (netWorthSeries.length >= 2) {
      const first = netWorthSeries[0]!.value;
      const last  = netWorthSeries[netWorthSeries.length - 1]!.value;
      const magnitude = first !== 0 ? (last - first) / Math.abs(first) : 0;

      if (Math.abs(magnitude) >= 0.01) {
        const direction = last > first ? TrendDirection.IMPROVING : TrendDirection.DECLINING;
        findings.push({
          id: "NET_WORTH_TRAJECTORY",
          type: AnalysisFindingType.GOAL_PROGRESS,
          metricType: MetricType.NET_WORTH,
          title: `Net Worth ${direction === TrendDirection.IMPROVING ? "Growing" : "Contracting"}`,
          description:
            `Net worth ${direction === TrendDirection.IMPROVING ? "grew" : "declined"} by ` +
            `${Math.abs(magnitude * 100).toFixed(1)}% over ${netWorthSeries.length} periods.`,
          direction,
          magnitude,
          confidence: this._trendConfidence(netWorthSeries.map((e) => e.value)),
          periodsCovered: netWorthSeries.length,
          supportingValues: netWorthSeries,
          detectedAt: new Date(),
        });
      }
    }

    // Savings velocity — is the rate of saving consistent?
    const savingsSeries = this._extract(snapshots, MetricType.SAVINGS_RATE);
    if (savingsSeries.length >= 2) {
      const positiveCount = savingsSeries.filter((e) => e.value > 0).length;
      const velocityScore = positiveCount / savingsSeries.length;

      if (velocityScore < 0.5) {
        findings.push({
          id: "SAVINGS_VELOCITY_LOW",
          type: AnalysisFindingType.GOAL_PROGRESS,
          metricType: MetricType.SAVINGS_RATE,
          title: "Savings Velocity Below Threshold",
          description:
            `Savings rate was positive in only ${positiveCount} of ${savingsSeries.length} periods, ` +
            `indicating infrequent active wealth accumulation.`,
          direction: TrendDirection.DECLINING,
          magnitude: velocityScore - 1,
          confidence: Math.min(1, savingsSeries.length / 6),
          periodsCovered: savingsSeries.length,
          supportingValues: savingsSeries,
          detectedAt: new Date(),
        });
      }
    }

    return findings;
  }

  private _extract(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
    type: MetricType,
  ): Array<{ period: string; value: number }> {
    return snapshots
      .map((s) => {
        const r = s.results.find((x) => x.type === type);
        return r ? { period: s.period.label, value: r.value } : null;
      })
      .filter((e): e is { period: string; value: number } => e !== null);
  }

  private _trendConfidence(values: number[]): number {
    if (values.length < 2) return 0;
    const dir = values[values.length - 1]! > values[0]! ? 1 : -1;
    let aligned = 0;
    for (let i = 1; i < values.length; i++) {
      if ((values[i]! - values[i - 1]!) * dir > 0) aligned++;
    }
    return aligned / (values.length - 1);
  }
}
