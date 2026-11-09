import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import { MetricType } from "../../metrics/MetricType";
import type { AnalyticsAnalyzer } from "../AnalyticsAnalyzer";
import type { AnalyzerDefinition } from "../AnalyzerDefinition";
import type { AnalyticsFinding } from "../AnalyticsFinding";
import { AnalysisFindingType } from "../AnalysisFindingType";
import { AnalyzerType } from "../AnalyzerType";
import { TrendDirection } from "../TrendDirection";

/**
 * BehaviourAnalyzer — identifies spending behaviour patterns.
 *
 * Examines two behavioural signals:
 *
 * 1. **Recurring spend creep**: whether RECURRING_SPEND is growing as a
 *    share of total income (BURN_RATE as income proxy). A rising ratio
 *    means more of each pound is pre-committed before discretionary spending.
 *
 * 2. **Savings compression**: when SAVINGS_RATE declines while BURN_RATE
 *    rises — spending growth is eroding savings capacity.
 *
 * Neither finding constitutes advice — they describe what the data shows.
 */
export class BehaviourAnalyzer implements AnalyticsAnalyzer {
  private static readonly DEFINITION: AnalyzerDefinition = {
    id: AnalyzerType.BEHAVIOUR,
    name: "Behaviour Analyzer",
    description: "Identifies spending behaviour patterns: recurring spend creep and savings compression.",
    version: "1.0",
    minimumSnapshots: 3,
  };

  definition(): AnalyzerDefinition {
    return BehaviourAnalyzer.DEFINITION;
  }

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): ReadonlyArray<AnalyticsFinding> {
    const findings: AnalyticsFinding[] = [];

    const recurringSpend = this._extract(snapshots, MetricType.RECURRING_SPEND);
    const burnRate       = this._extract(snapshots, MetricType.BURN_RATE);
    const savingsRate    = this._extract(snapshots, MetricType.SAVINGS_RATE);

    // 1. Recurring spend creep
    if (recurringSpend.length >= 3 && burnRate.length >= 3) {
      const aligned = this._align(snapshots, MetricType.RECURRING_SPEND, MetricType.BURN_RATE);
      if (aligned.length >= 3) {
        const ratios = aligned.map((e) => (e.b === 0 ? 0 : e.a / e.b));
        const first = ratios[0]!;
        const last = ratios[ratios.length - 1]!;
        const magnitude = first !== 0 ? (last - first) / Math.abs(first) : 0;

        if (magnitude > 0.05) {
          findings.push({
            id: "RECURRING_SPEND_CREEP",
            type: AnalysisFindingType.BEHAVIOUR,
            metricType: MetricType.RECURRING_SPEND,
            title: "Recurring Spend Creep Detected",
            description:
              `Recurring spend as a proportion of monthly outgoings has grown by ${(magnitude * 100).toFixed(1)}% ` +
              `over ${aligned.length} periods.`,
            direction: TrendDirection.DECLINING,
            magnitude,
            confidence: Math.min(1, aligned.length / 6),
            periodsCovered: aligned.length,
            supportingValues: aligned.map((e) => ({ period: e.period, value: e.a })),
            detectedAt: new Date(),
          });
        }
      }
    }

    // 2. Savings compression
    if (savingsRate.length >= 3 && burnRate.length >= 3) {
      const srFirst = savingsRate[0]!.value;
      const srLast  = savingsRate[savingsRate.length - 1]!.value;
      const brFirst = burnRate[0]!.value;
      const brLast  = burnRate[burnRate.length - 1]!.value;

      const savingsDrop  = srFirst !== 0 ? (srLast - srFirst) / Math.abs(srFirst) : 0;
      const burnIncrease = brFirst !== 0 ? (brLast - brFirst) / Math.abs(brFirst) : 0;

      if (savingsDrop < -0.05 && burnIncrease > 0.05) {
        findings.push({
          id: "SAVINGS_COMPRESSION",
          type: AnalysisFindingType.BEHAVIOUR,
          metricType: MetricType.SAVINGS_RATE,
          title: "Savings Rate Under Compression",
          description:
            `Savings rate fell by ${Math.abs(savingsDrop * 100).toFixed(1)}% while burn rate rose by ` +
            `${(burnIncrease * 100).toFixed(1)}% over ${savingsRate.length} periods.`,
          direction: TrendDirection.DECLINING,
          magnitude: savingsDrop,
          confidence: Math.min(1, savingsRate.length / 6),
          periodsCovered: savingsRate.length,
          supportingValues: savingsRate.map((e) => ({ period: e.period, value: e.value })),
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

  private _align(
    snapshots: ReadonlyArray<FinancialMetricsSnapshot>,
    typeA: MetricType,
    typeB: MetricType,
  ): Array<{ period: string; a: number; b: number }> {
    return snapshots
      .map((s) => {
        const rA = s.results.find((x) => x.type === typeA);
        const rB = s.results.find((x) => x.type === typeB);
        return rA && rB ? { period: s.period.label, a: rA.value, b: rB.value } : null;
      })
      .filter((e): e is { period: string; a: number; b: number } => e !== null);
  }
}
