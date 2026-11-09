export enum CoachRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
}

/**
 * A single turn in a coaching conversation.
 *
 * CoachMessages are immutable and append-only within a session.
 * They form the conversation history injected into subsequent prompts.
 *
 * The assistant message intentionally does not carry a full FinancialMemoryContext
 * reference — the full context is available via IFinancialMemoryService for any
 * turn that needs it. Storing a compact summary here keeps session memory lean.
 */
export interface CoachMessage {
  readonly id: string;
  readonly sessionId: string;
  readonly role: CoachRole;
  readonly content: string;
  /**
   * Compact one-sentence summary of the financial context used to generate
   * this response. Only set on ASSISTANT messages; null otherwise.
   * Preserved for auditability without bloating session memory.
   */
  readonly contextSummary: string | null;
  readonly createdAt: Date;
}
