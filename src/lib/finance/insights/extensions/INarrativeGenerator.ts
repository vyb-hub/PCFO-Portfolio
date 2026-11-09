import type { FinancialInsight } from "../FinancialInsight";
import type { FinancialInsightSnapshot } from "../FinancialInsightSnapshot";

/**
 * Extension point: generate a human-readable narrative paragraph from
 * a collection of insights.
 *
 * Implementations may use AI narration, template expansion, or rule-based
 * text generation. The engine itself never calls this interface — it is
 * invoked by the caller (e.g. AI Coach) after the snapshot is built.
 */
export interface INarrativeGenerator {
  /**
   * Produce a single narrative string from one or more FinancialInsights.
   * The narrative MUST be descriptive only — no instructions or advice.
   */
  generateNarrative(insights: ReadonlyArray<FinancialInsight>): string;

  /**
   * Produce an executive summary narrative from a complete snapshot.
   */
  generateSummaryNarrative(snapshot: FinancialInsightSnapshot): string;
}
