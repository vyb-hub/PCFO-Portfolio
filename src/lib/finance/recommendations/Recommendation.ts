import type { RecommendationCategory } from "./RecommendationCategory";
import type { RecommendationPriority } from "./RecommendationPriority";
import type { RecommendationAction } from "./RecommendationAction";
import type { RecommendationConfidence } from "./RecommendationConfidence";
import type { RecommendationImpact } from "./RecommendationImpact";

export type { RecommendationCategory } from "./RecommendationCategory";

/**
 * A single deterministic financial recommendation produced by a RecommendationGenerator.
 *
 * Recommendations are structured decisions — not conversational advice.
 * They carry a typed `action` (what to do), a `rationale` (why), structured
 * `impacts` (what improves), and full traceability to the insights, analytics
 * findings, and metric types that triggered them.
 *
 * Every recommendation answers "Why was this generated?" via:
 *   supportingInsightIds   → Insight.id references from InsightSnapshot
 *   supportingFindingIds   → AnalyticsFinding.id references from AnalyticsSnapshot
 *   supportingMetricTypes  → MetricType values from FinancialMetricsSnapshot
 *
 * Recommendations are immutable value objects. Persistence concerns (actedOn,
 * expiresAt) belong to the application layer, not this domain model.
 */
export interface Recommendation {
  /**
   * Stable identifier — e.g. "DEBT_DTI_EXCEEDED", "SAVINGS_RATE_LOW".
   * Unique within a RecommendationSnapshot.
   */
  readonly id: string;
  readonly category: RecommendationCategory;
  readonly priority: RecommendationPriority;
  /**
   * The structured action this recommendation requests.
   * Consumed by the AI Coach to build a narrative and by the What-If Engine
   * to model the impact.
   */
  readonly action: RecommendationAction;
  readonly title: string;
  /**
   * Explanation of why this recommendation applies right now.
   * References the specific financial context without prescribing exact steps —
   * that is the AI Coach's role.
   */
  readonly rationale: string;
  /**
   * One or more typed impact descriptions explaining what improves if acted on.
   * At least one impact is required per recommendation.
   */
  readonly impacts: ReadonlyArray<RecommendationImpact>;
  readonly confidence: RecommendationConfidence;
  /** Insight.id values from InsightSnapshot that triggered this recommendation. */
  readonly supportingInsightIds: ReadonlyArray<string>;
  /** AnalyticsFinding.id values from AnalyticsSnapshot that support this recommendation. */
  readonly supportingFindingIds: ReadonlyArray<string>;
  /** MetricType string values from FinancialMetricsSnapshot that this recommendation is based on. */
  readonly supportingMetricTypes: ReadonlyArray<string>;
  readonly generatedAt: Date;
}
