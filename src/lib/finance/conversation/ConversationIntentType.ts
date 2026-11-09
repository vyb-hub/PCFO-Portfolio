/**
 * The specific conversation primitive a user (or transport command) requested.
 *
 * Distinct from coach/CoachIntentType: that vocabulary is topic-shaped, for
 * classifying open-ended natural-language questions into financial domains
 * (SPENDING, DEBT, GOALS, ...) ahead of an LLM call. This vocabulary is
 * command-shaped, for resolving a bot interaction (a slash command, a button
 * press, or a short free-text phrase) into one of a fixed set of deterministic
 * deliverables. The two serve different purposes and are not interchangeable —
 * see ADR-020.
 */
export enum ConversationIntentType {
  DAILY_BRIEF = "DAILY_BRIEF",
  WEEKLY_REVIEW = "WEEKLY_REVIEW",
  MONTHLY_REVIEW = "MONTHLY_REVIEW",
  FINANCIAL_HEALTH = "FINANCIAL_HEALTH",
  LARGEST_EXPENSE = "LARGEST_EXPENSE",
  TOP_RISK = "TOP_RISK",
  GOAL_PROGRESS = "GOAL_PROGRESS",
  EXPLAIN_STORY = "EXPLAIN_STORY",
  EXPLAIN_RECOMMENDATION = "EXPLAIN_RECOMMENDATION",
  WHATS_CHANGED = "WHATS_CHANGED",
  /** Resolution failed or input didn't match any known command/keyword. */
  UNKNOWN = "UNKNOWN",

  /**
   * Proactive/system-triggered intents (EC-013 Financial Closing). No resolver
   * ever produces these from typed text — ClosingConversationEventMapper is
   * the only producer, tagging a ConversationResponse built from a domain
   * event rather than a resolved command. See ADR-021.
   */
  STATEMENT_MISSING = "STATEMENT_MISSING",
  MONTH_READY_TO_CLOSE = "MONTH_READY_TO_CLOSE",
  MONTH_CLOSED = "MONTH_CLOSED",
  SALARY_CONFIRMED = "SALARY_CONFIRMED",
}
