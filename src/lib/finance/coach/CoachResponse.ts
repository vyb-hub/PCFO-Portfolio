import type { CoachIntentType } from "./CoachIntent";

/**
 * The structured response from a single coaching turn.
 *
 * CoachResponse is the primary return type of ICoachService.ask().
 * It carries not just the LLM-generated text but provenance metadata —
 * which insights and recommendations were referenced, which model was used,
 * and token counts for cost tracking.
 *
 * The AI Coach never generates financial figures itself. All financial
 * facts in `content` come from the FinancialMemoryContext injected into
 * the prompt.
 */
export interface CoachResponse {
  readonly messageId: string;
  readonly sessionId: string;
  /** The LLM-generated natural language response. */
  readonly content: string;
  /** The intent the coach used when assembling context for this response. */
  readonly intent: CoachIntentType;
  /**
   * IDs of Recommendation objects referenced in the response.
   * Extracted from the FinancialMemoryContext by the PromptBuilder.
   * Enables the UI to link response text to recommendation cards.
   */
  readonly referencedRecommendationIds: ReadonlyArray<string>;
  /**
   * IDs of Insight objects referenced in the response.
   * Same purpose as referencedRecommendationIds.
   */
  readonly referencedInsightIds: ReadonlyArray<string>;
  /**
   * Provider-reported confidence (0–1), if available.
   * Most providers do not expose a top-level confidence score — null is the common case.
   */
  readonly confidence: number | null;
  /** The model identifier used to generate this response. */
  readonly providerModel: string;
  /** Prompt token count as reported by the LLM provider. Null if unavailable. */
  readonly promptTokens: number | null;
  /** Completion token count as reported by the LLM provider. Null if unavailable. */
  readonly completionTokens: number | null;
  readonly generatedAt: Date;
}
