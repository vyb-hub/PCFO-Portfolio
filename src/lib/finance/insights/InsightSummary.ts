import type { DateRange } from "../types/DateRange";
import type { InsightCategory } from "./InsightCategory";

/**
 * Lightweight read model derived from an InsightSnapshot.
 *
 * Suitable for dashboard cards, notification badges, and observability logging.
 * Does not carry insight detail — those remain in the full snapshot.
 */
export interface InsightSummary {
  readonly userId: string;
  readonly analysisWindow: DateRange;
  readonly generatedAt: Date;
  readonly totalInsights: number;
  readonly criticalInsights: number;
  readonly warningInsights: number;
  readonly infoInsights: number;
  /** Breakdown of insight counts by category. */
  readonly insightsByCategory: ReadonlyArray<{
    readonly category: InsightCategory;
    readonly count: number;
  }>;
  /** True when at least one CRITICAL insight is present. */
  readonly hasCritical: boolean;
  /** True when at least one generator threw. */
  readonly hasFailures: boolean;
}
