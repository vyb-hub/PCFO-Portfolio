import type { IFinancialMemoryService } from "../memory/IFinancialMemoryService";
import type { ICoachService } from "./ICoachService";
import type { CoachSession } from "./CoachSession";
import type { CoachResponse } from "./CoachResponse";
import type { IntentDetector } from "./intent/IntentDetector";
import type { PromptBuilder } from "./PromptBuilder";
import type { LLMProvider } from "./LLMProvider";
import type { CoachContext } from "./CoachContext";
import type { CoachMessage } from "./CoachMessage";
import { CoachRole } from "./CoachMessage";
import { CoachSessionStatus } from "./CoachSession";

/**
 * Internal mutable representation of a session.
 * The public CoachSession snapshot is produced from this on every read.
 */
interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  status: CoachSessionStatus;
  readonly messages: CoachMessage[];
  readonly startedAt: Date;
  endedAt: Date | null;
}

/**
 * Concrete orchestrating service for the AI Coach Platform.
 *
 * Wires together:
 *   - IntentDetector       — classifies the user query
 *   - IFinancialMemoryService — assembles FinancialMemoryContext
 *   - PromptBuilder        — constructs the LLM message list
 *   - LLMProvider          — generates the natural language response
 *
 * Session state is maintained in-process (MVP). For multi-process or
 * persistent sessions, replace the in-memory session map with a
 * SessionStore abstraction in a future milestone.
 *
 * Construction (via DI):
 *   new CoachService(
 *     new DefaultIntentDetector(),
 *     new DefaultPromptBuilder(),
 *     new NullLLMProvider(),          // or GeminiProvider
 *     memoryService,
 *   )
 */
export class CoachService implements ICoachService {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(
    private readonly intentDetector: IntentDetector,
    private readonly promptBuilder: PromptBuilder,
    private readonly llmProvider: LLMProvider,
    private readonly memoryService: IFinancialMemoryService,
  ) {}

  async startSession(userId: string): Promise<CoachSession> {
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      userId,
      status: CoachSessionStatus.ACTIVE,
      messages: [],
      startedAt: new Date(),
      endedAt: null,
    };
    this.sessions.set(record.id, record);
    return this.toSnapshot(record);
  }

  async ask(sessionId: string, userMessage: string): Promise<CoachResponse> {
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw new Error(`CoachService: session "${sessionId}" not found.`);
    }
    if (record.status === CoachSessionStatus.ENDED) {
      throw new Error(`CoachService: session "${sessionId}" has already ended.`);
    }

    // 1. Append user message to history
    const userMsg: CoachMessage = Object.freeze({
      id: crypto.randomUUID(),
      sessionId,
      role: CoachRole.USER,
      content: userMessage,
      contextSummary: null,
      createdAt: new Date(),
    });
    record.messages.push(userMsg);

    // 2. Detect intent
    const intent = this.intentDetector.detect(userMessage);

    // 3. Assemble financial memory context
    const memoryContext = await this.memoryService.assembleContext(record.userId, userMessage);

    // 4. Build coach context
    const coachContext: CoachContext = Object.freeze({
      userId: record.userId,
      sessionId,
      userQuery: userMessage,
      intent,
      memoryContext,
      conversationHistory: Object.freeze([...record.messages]),
      assembledAt: new Date(),
    });

    // 5. Build prompt
    const builtPrompt = this.promptBuilder.build(coachContext);

    // 6. Invoke LLM provider
    const llmResponse = await this.llmProvider.complete({
      messages: builtPrompt.messages,
      model: this.llmProvider.model,
    });

    // 7. Extract referenced IDs from memory entries (tagged entries carry recommendation/insight IDs)
    const { referencedInsightIds, referencedRecommendationIds } =
      this.extractReferencedIds(memoryContext.entries.map(e => e.tags).flat());

    // 8. Build structured response
    const now = new Date();
    const response: CoachResponse = Object.freeze({
      messageId: crypto.randomUUID(),
      sessionId,
      content: llmResponse.content,
      intent: intent.type,
      referencedRecommendationIds: Object.freeze(referencedRecommendationIds),
      referencedInsightIds: Object.freeze(referencedInsightIds),
      confidence: null,
      providerModel: llmResponse.model,
      promptTokens: llmResponse.promptTokens,
      completionTokens: llmResponse.completionTokens,
      generatedAt: now,
    });

    // 9. Append assistant message to history
    const contextSummary =
      `Used ${memoryContext.metadata.entriesConsumed} memory entries ` +
      `(${memoryContext.metadata.embeddingModel} embeddings, ` +
      `intent: ${intent.type}).`;
    const assistantMsg: CoachMessage = Object.freeze({
      id: response.messageId,
      sessionId,
      role: CoachRole.ASSISTANT,
      content: llmResponse.content,
      contextSummary,
      createdAt: now,
    });
    record.messages.push(assistantMsg);

    return response;
  }

  async endSession(sessionId: string): Promise<void> {
    const record = this.sessions.get(sessionId);
    if (!record) return;
    record.status = CoachSessionStatus.ENDED;
    record.endedAt = new Date();
  }

  async getSession(sessionId: string): Promise<CoachSession | null> {
    const record = this.sessions.get(sessionId);
    return record ? this.toSnapshot(record) : null;
  }

  async getSessionHistory(userId: string): Promise<ReadonlyArray<CoachSession>> {
    const sessions = Array.from(this.sessions.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .map(r => this.toSnapshot(r));
    return Object.freeze(sessions);
  }

  private toSnapshot(record: SessionRecord): CoachSession {
    return Object.freeze({
      id: record.id,
      userId: record.userId,
      status: record.status,
      messages: Object.freeze([...record.messages]),
      startedAt: record.startedAt,
      endedAt: record.endedAt,
    });
  }

  /** Extract insight and recommendation IDs from memory entry tags. */
  private extractReferencedIds(tags: readonly string[]): {
    referencedInsightIds: string[];
    referencedRecommendationIds: string[];
  } {
    const referencedInsightIds: string[] = [];
    const referencedRecommendationIds: string[] = [];
    for (const tag of tags) {
      if (tag.startsWith("insight:")) {
        referencedInsightIds.push(tag.slice("insight:".length));
      } else if (tag.startsWith("recommendation:")) {
        referencedRecommendationIds.push(tag.slice("recommendation:".length));
      }
    }
    return { referencedInsightIds, referencedRecommendationIds };
  }
}
