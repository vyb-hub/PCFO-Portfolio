import type { PipelineResult } from "./PipelineResult";
import type { FinancialReview } from "../reviews/FinancialReview";
import type { ConversationEngineInput } from "../conversation/ConversationEngineInput";

/**
 * The shared, reusable entry point for "give me this user's latest financial
 * state" — the one thing every consumer (Dashboard, Telegram, Email, Push
 * Notifications, Voice, future APIs) should call instead of invoking
 * IFinancialPipeline.run() directly.
 *
 * EC-012: introduced so transports never orchestrate the pipeline themselves.
 * Each method narrows PipelineResult to exactly what that consumer needs —
 * callers should prefer the narrowest method that covers their case.
 *
 * No caching yet: every call re-runs the full pipeline. A cache is a
 * legitimate future optimisation once real usage shows repeated calls in a
 * short window; it isn't built speculatively here (see ADR-020).
 */
export interface IFinancialStateService {
  /** Full pipeline output — for consumers that need every intermediate snapshot (the dashboard). */
  getPipelineResult(userId: string): Promise<PipelineResult>;

  /** Just the assembled monthly review. */
  getLatestReview(userId: string): Promise<FinancialReview>;

  /** The narrow bundle ConversationEngine needs — story, review, insights, recommendations. */
  getConversationInput(userId: string): Promise<ConversationEngineInput>;
}
