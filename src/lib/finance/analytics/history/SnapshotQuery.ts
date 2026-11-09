/**
 * Parameters for retrieving historical FinancialMetricsSnapshots.
 *
 * SnapshotQuery is an INTERNAL type — it is not part of the public
 * analytics contract. External consumers never need to construct queries;
 * only AnalyticsService (and its infrastructure implementations) use this.
 */
export interface SnapshotQuery {
  readonly userId: string;
  /**
   * Maximum number of snapshots to return, ordered newest-first.
   * The AnalyticsService selects a sensible default (e.g. 12 for 1 year).
   */
  readonly limit: number;
  /**
   * If provided, exclude the snapshot generated at exactly this timestamp.
   * Used to avoid duplicating the "current" snapshot that the service
   * already holds when merging with historical results.
   */
  readonly excludeGeneratedAt?: Date;
}
