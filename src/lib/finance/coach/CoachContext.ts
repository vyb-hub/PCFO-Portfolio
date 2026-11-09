import type { FinancialMemoryContext } from "../memory/FinancialMemoryContext";
import type { CoachIntent } from "./CoachIntent";
import type { CoachMessage } from "./CoachMessage";

/**
 * The assembled context for a single coaching turn.
 *
 * CoachContext is the handoff object between the CoachService (which
 * assembles the context) and the PromptBuilder (which turns it into
 * an LLM prompt). Neither the service nor the builder reaches outside
 * this object to fetch additional data.
 *
 * Design rule: the CoachService decides WHAT context to include.
 * The PromptBuilder decides HOW to format it for the LLM.
 */
export interface CoachContext {
  readonly userId: string;
  readonly sessionId: string;
  /** The original query exactly as the user typed it. */
  readonly userQuery: string;
  /** The classified intent that drove context assembly. */
  readonly intent: CoachIntent;
  /**
   * The financial memory context assembled for this turn.
   * Contains the contextText field ready for prompt injection.
   */
  readonly memoryContext: FinancialMemoryContext;
  /**
   * Prior turns in this session, ordered oldest first.
   * Bounded to the most recent N messages to stay within the LLM context window.
   */
  readonly conversationHistory: ReadonlyArray<CoachMessage>;
  readonly assembledAt: Date;
}
