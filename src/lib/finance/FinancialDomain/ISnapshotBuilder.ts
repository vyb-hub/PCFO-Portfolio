import type { FinancialSnapshot } from "../analytics/FinancialSnapshot";
import type { DateRange } from "../types/DateRange";

/**
 * Contract for building FinancialSnapshots.
 *
 * Separating snapshot construction from the domain facade allows
 * the builder to be tested and evolved independently.
 * The implementation orchestrates calls to all domain services
 * to produce a consistent, point-in-time view.
 *
 * Snapshots are immutable value objects — the builder always produces
 * a new snapshot rather than mutating an existing one.
 */
export interface ISnapshotBuilder {
  /**
   * Build a snapshot representing the user's current financial state.
   * The snapshot period defaults to the current calendar month.
   */
  build(userId: string): Promise<FinancialSnapshot>;

  /**
   * Build a snapshot for a specific historical period.
   * Used by the What-If Engine and Goal Planner for projections.
   */
  buildForPeriod(userId: string, period: DateRange): Promise<FinancialSnapshot>;
}
