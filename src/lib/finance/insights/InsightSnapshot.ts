import type { DateRange } from "../types/DateRange";
import type { Insight } from "./Insight";
import type { InsightMetadata } from "./InsightMetadata";

/**
 * A record of a single generator that threw during InsightEngine.generate().
 *
 * Captured failures do not abort the generation run — partial snapshots
 * (some generators succeeded, some failed) are still valid and usable.
 */
export interface InsightGenerationFailure {
  readonly generatorName: string;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

/**
 * An immutable point-in-time record of all financial insights derived
 * from one AnalyticsSnapshot.
 *
 * InsightSnapshot is the official contract between the Insight Platform
 * and all downstream layers (Recommendation Platform, AI Coach, Dashboard).
 *
 * No downstream layer should access InsightGenerator implementations directly.
 * No downstream layer needs to know which generators ran, how insights were
 * produced, or what analytics data was consumed.
 *
 * Insights are sorted by severity: CRITICAL first, WARNING second, INFO last.
 *
 * Construction:
 *   const snapshot = new InsightEngine(registry).generate(analyticsSnapshot);
 *
 * Access:
 *   service.getByCategory(snapshot, InsightCategory.RISK)
 *   service.getBySeverity(snapshot, InsightSeverity.CRITICAL)
 */
export interface InsightSnapshot {
  readonly userId: string;
  /**
   * The analysis window inherited from the source AnalyticsSnapshot.
   * Preserves full traceability to the original metric history.
   */
  readonly analysisWindow: DateRange;
  readonly metadata: InsightMetadata;
  /** All insights, sorted CRITICAL → WARNING → INFO. */
  readonly insights: ReadonlyArray<Insight>;
  /** Generators that threw during execution. */
  readonly failures: ReadonlyArray<InsightGenerationFailure>;
}
