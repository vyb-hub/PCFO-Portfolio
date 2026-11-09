import type { MetricType } from "../metrics/MetricType";
import type { TrendDirection } from "./TrendDirection";
import type { TrendStrength } from "./TrendStrength";
import type { TrendStats } from "./TrendStats";
import type { TrendDataPoint } from "./TrendDataPoint";

/**
 * The complete trend analysis result for a single metric type.
 *
 * Named MetricTrendResult (not MetricTrend) to avoid collision with the
 * MetricTrend enum in metrics/MetricType.ts.
 */
export interface MetricTrendResult {
  readonly metricType: MetricType;
  readonly direction: TrendDirection;
  readonly strength: TrendStrength;
  /** True when a rising value indicates improving health for this metric. */
  readonly isHigherBetter: boolean;
  readonly stats: TrendStats;
  readonly dataPoints: ReadonlyArray<TrendDataPoint>;
  readonly periodsAnalyzed: number;
  readonly analyzedAt: Date;
}
