// @depends-on: FinancialMetricsSnapshot, AnalyticsSnapshot, FinancialInsightSnapshot, RecommendationSnapshot, FinancialStorySnapshot

import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";
import type { FinancialMemoryEntry } from "./FinancialMemoryEntry";
import type { FinancialMemoryContext } from "./FinancialMemoryContext";
import type { MemorySearchQuery, MemorySearchResult } from "./MemorySearch";
import type { MemoryEntryType } from "./MemoryEntry";

/**
 * Service contract for the Financial Memory Platform.
 *
 * The Memory Platform is the final layer in the Financial Intelligence pipeline.
 * It persists, indexes, and retrieves historical financial understanding so that
 * downstream AI consumers (AI Coach, Monthly Review, What-If Engine) can access
 * a user's financial history without re-running the full pipeline.
 *
 * Responsibilities:
 *   - Store immutable snapshots as searchable memory entries
 *   - Retrieve context by time, category, tag, or semantic similarity
 *   - Assemble FinancialMemoryContext for direct prompt injection
 *   - Maintain store health via expiry-based pruning
 *
 * This service never:
 *   - Calls any AI provider (embeddings are delegated to MemoryEmbeddingProvider)
 *   - Accesses repositories or the database directly
 *   - Computes financial metrics or generates recommendations
 *
 * Dependency flow:
 *   MetricsSnapshot → AnalyticsSnapshot → FinancialInsightSnapshot → RecommendationSnapshot → FinancialStorySnapshot
 *     → IFinancialMemoryService  ← you are here
 *     → AI Coach (reads FinancialMemoryContext), Conversation Platform (EC-012)
 */
export interface IFinancialMemoryService {
  // --- Storage ---

  /**
   * Index a FinancialMetricsSnapshot into memory.
   * Produces one summary entry plus one entry per unhealthy metric.
   */
  storeMetrics(userId: string, snapshot: FinancialMetricsSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Index an AnalyticsSnapshot into memory.
   * Produces one entry per AnalyticsFinding.
   */
  storeAnalytics(userId: string, snapshot: AnalyticsSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Index a FinancialInsightSnapshot into memory.
   * Produces one entry per FinancialInsight.
   *
   * EC-012: retyped from the legacy InsightSnapshot, which the real pipeline
   * has never produced — this method was unreachable against real data
   * before this fix. See ADR-020.
   */
  storeInsights(userId: string, snapshot: FinancialInsightSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Index a RecommendationSnapshot into memory.
   * Produces one entry per Recommendation.
   */
  storeRecommendations(userId: string, snapshot: RecommendationSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Index a FinancialStorySnapshot into memory. (EC-012)
   * Produces one entry per StoryBlock.
   */
  storeStory(userId: string, snapshot: FinancialStorySnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Store a free-form conversation note (e.g. a user preference expressed in chat).
   * The note is embedded and persisted as a CONVERSATION_NOTE entry.
   */
  storeConversationNote(userId: string, content: string, tags?: readonly string[]): Promise<FinancialMemoryEntry>;

  // --- Retrieval ---

  /**
   * Search memory using filter parameters and/or semantic similarity.
   * Providing query.text triggers vector search; omitting it uses deterministic filters.
   */
  search(query: MemorySearchQuery): Promise<ReadonlyArray<MemorySearchResult>>;

  /**
   * Assemble a FinancialMemoryContext for the given user and query.
   * The context is ready for direct injection into an AI prompt's context window.
   *
   * @param userId
   * @param query Natural-language query driving the retrieval
   * @param windowSize Maximum number of entries to include (defaults to 8)
   */
  assembleContext(userId: string, query: string, windowSize?: number): Promise<FinancialMemoryContext>;

  // --- Maintenance ---

  /** Delete all entries past their expiresAt date. Returns the number deleted. */
  pruneExpired(userId: string): Promise<number>;

  /** Retrieve all stored entries for a user, newest first, with optional type filter. */
  getAll(userId: string, types?: ReadonlyArray<MemoryEntryType>): Promise<ReadonlyArray<FinancialMemoryEntry>>;
}
