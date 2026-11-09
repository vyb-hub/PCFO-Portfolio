/**
 * Semantic version of the FinancialMetricsSnapshot schema.
 *
 * Bump major when the snapshot structure changes in a breaking way.
 * Bump minor when new fields are added (backwards compatible).
 * Bump patch for corrections that don't change structure.
 *
 * Consumers (Analytics, Insights) can read version and reject snapshots
 * they were not built to handle.
 */
export interface SnapshotVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export const CURRENT_SNAPSHOT_VERSION: SnapshotVersion = {
  major: 1,
  minor: 0,
  patch: 0,
};

export function formatSnapshotVersion(v: SnapshotVersion): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}
