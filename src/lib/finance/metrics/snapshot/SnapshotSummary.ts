import type { AggregatePeriod } from "../../aggregation/AggregatePeriod";
import type { SnapshotVersion } from "./SnapshotVersion";

/**
 * A lightweight read model derived from a FinancialMetricsSnapshot.
 *
 * SnapshotSummary carries only the facts needed to decide whether a
 * snapshot is usable and to display it in list or dashboard views.
 * It does not carry metric values — those remain in the full snapshot.
 */
export interface SnapshotSummary {
  readonly userId: string;
  readonly period: AggregatePeriod;
  readonly generatedAt: Date;
  readonly version: SnapshotVersion;
  readonly totalMetrics: number;
  readonly successfulMetrics: number;
  readonly failedMetrics: number;
  /** True if every registered metric computed successfully. */
  readonly isComplete: boolean;
}
