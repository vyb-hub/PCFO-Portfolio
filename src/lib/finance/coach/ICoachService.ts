// @depends-on: IFinancialMemoryService, FinancialMemoryContext, LLMProvider

import type { CoachSession } from "./CoachSession";
import type { CoachResponse } from "./CoachResponse";

/**
 * Service contract for the AI Financial Coach.
 *
 * The coach is the final consumer of the Financial Intelligence pipeline.
 * It accepts a user query, detects conversational intent, assembles
 * FinancialMemoryContext from the Memory Platform, constructs a prompt,
 * invokes an LLM provider, and returns a structured CoachResponse.
 *
 * The coach never:
 *   - Computes financial metrics
 *   - Runs analytics or generates insights
 *   - Produces recommendations
 *   - Calls repositories directly
 *   - Generates financial figures independently
 *
 * All financial facts in the response originate from FinancialMemoryContext.
 *
 * Dependency flow:
 *   IFinancialMemoryService  (assembles FinancialMemoryContext)
 *   LLMProvider              (generates natural language response)
 *     → ICoachService        ← you are here
 *
 * EC-012 note: this platform remains fully built but unwired — no caller,
 * no factory function, and LLMProvider has no working implementation
 * (GeminiProvider/OpenAIProvider throw; NullLLMProvider is a canned stub).
 * The Conversation Platform (src/lib/finance/conversation/) is deliberately
 * deterministic and does not depend on this service. Whether coach/ becomes
 * the real implementation of conversation/'s IConversationResponder seam,
 * gets merged into conversation/, or is superseded is an explicit deferred
 * decision — see ADR-020 Decision 1. Not decided by this comment; just
 * pointing a future reader at where the decision lives.
 */
export interface ICoachService {
  /**
   * Start a new coaching session for the user.
   * Returns an empty ACTIVE session with no messages.
   */
  startSession(userId: string): Promise<CoachSession>;

  /**
   * Submit a user message and receive a structured coaching response.
   * The service assembles financial context internally via IFinancialMemoryService.
   *
   * @throws Error if the session is not found or has ENDED status.
   */
  ask(sessionId: string, userMessage: string): Promise<CoachResponse>;

  /** Mark a session as ENDED. No further ask() calls are accepted on it. */
  endSession(sessionId: string): Promise<void>;

  /** Retrieve a specific session by ID. Returns null if not found. */
  getSession(sessionId: string): Promise<CoachSession | null>;

  /** Retrieve all sessions for a user, newest first. */
  getSessionHistory(userId: string): Promise<ReadonlyArray<CoachSession>>;
}
