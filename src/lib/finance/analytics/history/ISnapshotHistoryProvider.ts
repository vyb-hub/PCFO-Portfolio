import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { SnapshotQuery } from "./SnapshotQuery";

/**
 * Internal port for retrieving stored FinancialMetricsSnapshots.
 *
 * ISnapshotHistoryProvider is an INTERNAL type — it is NOT part of the
 * public analytics contract. Implementations (Prisma, Redis, in-memory)
 * belong to the infrastructure layer.
 *
 * The Analytics Platform depends on this interface; infrastructure depends
 * on Analytics. This keeps the dependency direction clean.
 *
 * Note: this interface is deliberately excluded from the public analytics
 * barrel export. Exposing it would leak history as an architectural boundary,
 * contrary to EC-006 design principles.
 */
export interface ISnapshotHistoryProvider {
  /**
   * Return historical snapshots ordered newest-first.
   *
   * Implementations must:
   *   - Return at most query.limit results.
   *   - Exclude the snapshot at query.excludeGeneratedAt if provided.
   *   - Return an empty array (not throw) when no history exists.
   */
  getHistory(query: SnapshotQuery): Promise<ReadonlyArray<FinancialMetricsSnapshot>>;
}
