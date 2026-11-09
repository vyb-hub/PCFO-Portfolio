import type { DateRange } from "../types/DateRange";
import type { AnalysisFindingType } from "./AnalysisFindingType";

/**
 * Lightweight read model derived from an AnalyticsSnapshot.
 *
 * Suitable for list views, dashboard cards, and observability logging.
 * Does not carry finding details — those remain in the full snapshot.
 */
export interface AnalyticsSummary {
  readonly userId: string;
  readonly analysisWindow: DateRange;
  readonly analyzedAt: Date;
  readonly snapshotsAnalyzed: number;
  readonly totalFindings: number;
  /** Breakdown of finding counts by type. */
  readonly findingsByType: ReadonlyArray<{ readonly type: AnalysisFindingType; readonly count: number }>;
  /** True when at least one RISK finding is present. */
  readonly hasRisks: boolean;
  /** True when at least one analyzer threw. */
  readonly hasFailures: boolean;
}
