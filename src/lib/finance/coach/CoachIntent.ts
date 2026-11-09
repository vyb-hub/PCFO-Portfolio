/**
 * The conversational intent category detected from a user query.
 *
 * Intent drives which context the CoachService assembles and which
 * PromptTemplate it selects before invoking the LLM provider.
 * Detection is deterministic — no LLM is called to classify intent.
 */
export enum CoachIntentType {
  FINANCIAL_HEALTH = "FINANCIAL_HEALTH",
  SPENDING = "SPENDING",
  DEBT = "DEBT",
  INVESTMENTS = "INVESTMENTS",
  GOALS = "GOALS",
  AFFORDABILITY = "AFFORDABILITY",
  FORECASTING = "FORECASTING",
  GENERAL = "GENERAL",
}

/**
 * The result of running an IntentDetector on a user query.
 *
 * confidence is always in [0, 1]. A GENERAL intent with confidence 0.5
 * means no specific keywords matched; the coach will use a broad financial
 * health context and let the LLM steer.
 */
export interface CoachIntent {
  readonly type: CoachIntentType;
  /** Fraction of the intent's keyword set matched by the query (0–1). */
  readonly confidence: number;
  /** Keywords from the query that triggered this classification. */
  readonly matchedKeywords: ReadonlyArray<string>;
}
