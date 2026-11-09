import type { SnapshotVersion } from "./SnapshotVersion";

/**
 * Provenance and execution statistics for a FinancialMetricsSnapshot.
 *
 * aggregatedAt traces the snapshot back to the FinancialAggregate that
 * was its input — useful for cache invalidation and audit.
 */
export interface SnapshotMetadata {
  readonly userId: string;
  /** When this snapshot was built by FinancialMetricsSnapshotService. */
  readonly generatedAt: Date;
  /** FinancialAggregate.aggregatedAt — the timestamp of the input data. */
  readonly aggregatedAt: Date;
  readonly version: SnapshotVersion;
  /** Total number of metric types the engine attempted. */
  readonly totalAttempted: number;
  /** Number of metrics that produced a result. */
  readonly successfulMetrics: number;
  /** Number of metrics that threw during calculation. */
  readonly failedMetrics: number;
}
