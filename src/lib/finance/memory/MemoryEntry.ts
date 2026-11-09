/**
 * The type of financial fact or event being stored in memory.
 */
export enum MemoryEntryType {
  /** An AI-generated insight that was surfaced to the user. */
  INSIGHT = "INSIGHT",
  /** A recommendation the user acted on. */
  ACTED_RECOMMENDATION = "ACTED_RECOMMENDATION",
  /** A detected spending or income pattern. */
  PATTERN = "PATTERN",
  /** A change in a goal's status or contribution. */
  GOAL_UPDATE = "GOAL_UPDATE",
  /** A change in a debt's balance or payoff milestone. */
  DEBT_CHANGE = "DEBT_CHANGE",
  /** A behavioural observation (e.g. post-salary splurge, weekend overspending). */
  BEHAVIOURAL_NOTE = "BEHAVIOURAL_NOTE",
  /** A user preference or instruction expressed in conversation. */
  USER_PREFERENCE = "USER_PREFERENCE",
  // EC-009: Financial Memory Platform
  /** An indexed entry from a FinancialMetricsSnapshot. */
  METRICS_SNAPSHOT = "METRICS_SNAPSHOT",
  /** An indexed entry from an AnalyticsFinding. */
  ANALYTICS_FINDING = "ANALYTICS_FINDING",
  /** An indexed entry from a Recommendation. */
  RECOMMENDATION = "RECOMMENDATION",
  /** A note stored from a coaching conversation. */
  CONVERSATION_NOTE = "CONVERSATION_NOTE",
  // EC-012: Conversation Platform
  /** An indexed entry from a StoryBlock. */
  STORY_BLOCK = "STORY_BLOCK",
}

/**
 * A single entry in the user's financial memory store.
 *
 * The embedding vector enables semantic search (RAG retrieval).
 * The plain-text content is what gets injected into the AI Coach's context window.
 */
export interface MemoryEntry {
  readonly id: string;
  readonly userId: string;
  readonly type: MemoryEntryType;
  /** Human-readable summary of the memory, injected directly into prompts. */
  readonly content: string;
  /** Dense embedding vector for semantic similarity search. */
  readonly embedding: readonly number[];
  /** The financial period this memory pertains to (e.g. "2025-06"). */
  readonly period: string | null;
  readonly relatedEntityType: string | null;
  readonly relatedEntityId: string | null;
  readonly createdAt: Date;
  /** Memories can expire; null means they persist indefinitely. */
  readonly expiresAt: Date | null;
}
