import type { PipelineResult } from "../pipeline/PipelineResult";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";
import type { FinancialReview } from "../reviews/FinancialReview";

/** Bump whenever this field set changes — lets a future reader (dashboard,
 * report template, RAG retrieval) know how to interpret an older archived
 * month's shape. See ADR-021. */
export const CLOSING_SNAPSHOT_SCHEMA_VERSION = 1;

/**
 * The canonical Financial Intelligence Platform outputs pinned at close
 * time — `PipelineResult` minus `aggregate` and `metadata`. Never touched as
 * untyped JSON outside PrismaFinancialMonthRepository, which owns the
 * serialize/deserialize boundary to the `closingSnapshot: Json` column.
 *
 * `aggregate` is deliberately excluded: it's the one field of PipelineResult
 * that scales with transaction count (its several derived views each
 * re-serialize the same transactions), and excluding it costs no fidelity —
 * raw transactions are already durably persisted in the Transaction table,
 * queryable by period + userId. Every field kept here is bounded by
 * generator/analyzer/metric count, not transaction volume. See ADR-021 for
 * the full size/fidelity reasoning.
 */
export interface ClosingSnapshot {
  readonly schemaVersion: number;
  /** APP_VERSION at capture time — which build of the platform computed this. */
  readonly pipelineVersion: string;
  readonly capturedAt: Date;
  readonly metricsSnapshot: FinancialMetricsSnapshot;
  readonly trendReport: TrendReport;
  readonly analyticsSnapshot: AnalyticsSnapshot;
  readonly insightSnapshot: FinancialInsightSnapshot;
  readonly recommendationSnapshot: RecommendationSnapshot;
  readonly storySnapshot: FinancialStorySnapshot;
  readonly review: FinancialReview;
}

/** The one place PipelineResult gets narrowed into a ClosingSnapshot — called
 * from FinancialMonthClosingService.closeMonth(). */
export function buildClosingSnapshot(result: PipelineResult, pipelineVersion: string): ClosingSnapshot {
  return Object.freeze({
    schemaVersion: CLOSING_SNAPSHOT_SCHEMA_VERSION,
    pipelineVersion,
    capturedAt: new Date(),
    metricsSnapshot: result.metricsSnapshot,
    trendReport: result.trendReport,
    analyticsSnapshot: result.analyticsSnapshot,
    insightSnapshot: result.insightSnapshot,
    recommendationSnapshot: result.recommendationSnapshot,
    storySnapshot: result.storySnapshot,
    review: result.review,
  });
}
