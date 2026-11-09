import type { InsightCategory } from "./InsightCategory";
import type { InsightSeverity } from "./InsightSeverity";
import type { InsightConfidence } from "./InsightConfidence";

/**
 * A single deterministic financial insight produced by an InsightGenerator.
 *
 * Insights interpret analytical observations — they describe what patterns
 * mean in plain language. They do not prescribe actions; that is the role
 * of the Recommendation Platform.
 *
 * Every Insight carries a reference to the AnalyticsFinding IDs that produced
 * it (`supportingFindingIds`), making every insight fully traceable.
 *
 * Insights are immutable value objects. The InsightEngine assembles them into
 * an InsightSnapshot, which is the contract for all downstream consumers.
 */
export interface Insight {
  /**
   * Stable identifier — e.g. "SAVINGS_RATE_TREND_INSIGHT".
   * Multi-finding insights use "OPPORTUNITY_COMBINED_0", etc.
   */
  readonly id: string;
  readonly category: InsightCategory;
  readonly severity: InsightSeverity;
  readonly confidence: InsightConfidence;
  readonly title: string;
  /** Plain-language explanation of what the pattern means. No advice; no imperatives. */
  readonly description: string;
  /**
   * AnalyticsFinding.id values that produced this insight.
   * Non-empty — every insight must trace back to at least one finding.
   */
  readonly supportingFindingIds: ReadonlyArray<string>;
  readonly generatedAt: Date;
}
