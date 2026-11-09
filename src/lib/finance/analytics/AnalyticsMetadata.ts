/**
 * Provenance and execution statistics for an AnalyticsSnapshot.
 */
export interface AnalyticsMetadata {
  readonly userId: string;
  readonly analyzedAt: Date;
  /** How many FinancialMetricsSnapshots were fed into the engine. */
  readonly snapshotsAnalyzed: number;
  /** How many analyzers ran (those that met minimumSnapshots threshold). */
  readonly analyzersRun: number;
  /** How many analyzers were skipped due to insufficient snapshot history. */
  readonly analyzersSkipped: number;
  /** How many analyzers threw during execution. */
  readonly analyzerFailures: number;
  /** Total findings produced across all analyzers. */
  readonly totalFindings: number;
}
