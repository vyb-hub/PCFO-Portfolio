import type { MetricType } from "../metrics/MetricType";

/**
 * The traceability bundle answering "why does this StoryBlock exist?"
 * without reading implementation code.
 *
 * Every field is an ID/type reference into an upstream snapshot — never a
 * copy of the referenced object — mirroring ADR-017 Decision 2 (FinancialReview
 * sections reference IDs, not objects). A consumer that needs the full
 * FinancialInsight or Recommendation holds the source snapshot alongside the
 * story and looks it up by ID.
 *
 * A given StoryBlock will typically populate only the fields relevant to how
 * it was derived — a block built directly from FinancialAggregate (e.g.
 * "largest expense this month") has no upstream metric/insight/recommendation
 * to reference and instead points at the raw transactions that prove it.
 */
export interface StoryEvidence {
  readonly supportingMetricTypes: ReadonlyArray<MetricType>;
  readonly supportingFindingIds: ReadonlyArray<string>;
  readonly supportingInsightIds: ReadonlyArray<string>;
  readonly supportingRecommendationIds: ReadonlyArray<string>;
  readonly supportingTransactionIds: ReadonlyArray<string>;
}

export const EMPTY_STORY_EVIDENCE: StoryEvidence = Object.freeze({
  supportingMetricTypes: Object.freeze([]),
  supportingFindingIds: Object.freeze([]),
  supportingInsightIds: Object.freeze([]),
  supportingRecommendationIds: Object.freeze([]),
  supportingTransactionIds: Object.freeze([]),
});
