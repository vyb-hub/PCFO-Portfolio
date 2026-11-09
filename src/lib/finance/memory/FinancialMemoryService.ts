import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";
import type { IFinancialMemoryService } from "./IFinancialMemoryService";
import type { FinancialMemoryEntry, FinancialMemoryEntryDraft } from "./FinancialMemoryEntry";
import type { FinancialMemoryContext } from "./FinancialMemoryContext";
import type { MemoryEmbeddingProvider } from "./MemoryEmbeddingProvider";
import type { MemoryStore } from "./MemoryStore";
import type { MemoryIndexer } from "./MemoryIndexer";
import type { MemorySearchQuery, MemorySearchResult } from "./MemorySearch";
import type { MemoryEntryType } from "./MemoryEntry";
import { FinancialSnapshotType } from "./FinancialMemoryEntry";
import { MemoryEntryType as MemoryEntryTypeEnum } from "./MemoryEntry";

/**
 * Concrete orchestrating service for the Financial Memory Platform.
 *
 * Wires together MemoryIndexer (snapshot → drafts), MemoryEmbeddingProvider
 * (text → vectors), and MemoryStore (vectors → persistence + retrieval).
 *
 * The service is the only class that coordinates all three dependencies.
 * Swap any component (embedding provider, store) without touching this class.
 *
 * Construction (via DI):
 *   new FinancialMemoryService(
 *     new InMemoryMemoryStore(),          // or PgVectorMemoryStore
 *     new DefaultMemoryIndexer(),
 *     new NullEmbeddingProvider(),        // or GeminiEmbeddingProvider
 *   )
 */
export class FinancialMemoryService implements IFinancialMemoryService {
  constructor(
    private readonly store: MemoryStore,
    private readonly indexer: MemoryIndexer,
    private readonly embeddingProvider: MemoryEmbeddingProvider,
  ) {}

  private async materializeBatch(
    drafts: ReadonlyArray<FinancialMemoryEntryDraft>,
  ): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    if (drafts.length === 0) return Object.freeze([]);
    const texts = drafts.map(d => d.content);
    const embeddings = await this.embeddingProvider.embedBatch(texts);
    const now = new Date();
    const entries: FinancialMemoryEntry[] = drafts.map((draft, i) =>
      Object.freeze({
        ...draft,
        id: crypto.randomUUID(),
        embedding: embeddings[i] ?? null,
        createdAt: now,
      }),
    );
    await Promise.all(entries.map(e => this.store.save(e)));
    return Object.freeze(entries);
  }

  async storeMetrics(userId: string, snapshot: FinancialMetricsSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    const drafts = this.indexer.indexMetrics(userId, snapshot);
    return this.materializeBatch(drafts);
  }

  async storeAnalytics(userId: string, snapshot: AnalyticsSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    const drafts = this.indexer.indexAnalytics(userId, snapshot);
    return this.materializeBatch(drafts);
  }

  async storeInsights(userId: string, snapshot: FinancialInsightSnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    const drafts = this.indexer.indexInsights(userId, snapshot);
    return this.materializeBatch(drafts);
  }

  async storeRecommendations(
    userId: string,
    snapshot: RecommendationSnapshot,
  ): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    const drafts = this.indexer.indexRecommendations(userId, snapshot);
    return this.materializeBatch(drafts);
  }

  async storeStory(userId: string, snapshot: FinancialStorySnapshot): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    const drafts = this.indexer.indexStory(userId, snapshot);
    return this.materializeBatch(drafts);
  }

  async storeConversationNote(
    userId: string,
    content: string,
    tags: readonly string[] = [],
  ): Promise<FinancialMemoryEntry> {
    const draft: FinancialMemoryEntryDraft = {
      userId,
      type: MemoryEntryTypeEnum.CONVERSATION_NOTE,
      snapshotType: FinancialSnapshotType.CONVERSATION,
      content,
      period: null,
      tags: Object.freeze([...tags]),
      categories: Object.freeze([]),
      sourceSnapshotId: null,
      expiresAt: null,
    };
    const entries = await this.materializeBatch([draft]);
    const entry = entries[0];
    if (!entry) throw new Error("FinancialMemoryService: failed to materialize conversation note");
    return entry;
  }

  async search(query: MemorySearchQuery): Promise<ReadonlyArray<MemorySearchResult>> {
    const limit = query.limit ?? 10;

    if (!query.text) {
      // Deterministic filter-based retrieval
      const filter = {
        types: query.types,
        snapshotTypes: query.snapshotTypes,
        since: query.since,
        period: query.period,
        tags: query.tags,
        categories: query.categories,
      };
      const entries = await this.store.getAll(query.userId, filter);
      return Object.freeze(
        entries.slice(0, limit).map(entry => ({
          entry,
          relevanceScore: 1.0,
          matchedBy: "TEMPORAL" as const,
        })),
      );
    }

    // Semantic vector search
    const queryEmbedding = await this.embeddingProvider.embed(query.text);
    const results = await this.store.findBySimilarity(
      query.userId,
      queryEmbedding.vector,
      limit,
      query.minRelevance ?? 0.7,
    );
    return Object.freeze(
      results.map(r => ({
        entry: r.entry,
        relevanceScore: r.score,
        matchedBy: "SEMANTIC" as const,
      })),
    );
  }

  async assembleContext(
    userId: string,
    query: string,
    windowSize = 8,
  ): Promise<FinancialMemoryContext> {
    const queryEmbedding = await this.embeddingProvider.embed(query);
    const similarityResults = await this.store.findBySimilarity(
      userId,
      queryEmbedding.vector,
      windowSize,
      0.6,
    );

    // Fall back to most-recent entries when no vectors are available (NullEmbeddingProvider)
    const entries: ReadonlyArray<FinancialMemoryEntry> =
      similarityResults.length > 0
        ? Object.freeze(similarityResults.map(r => r.entry))
        : (await this.store.getAll(userId)).slice(0, windowSize);

    const totalEntries = await this.store.countAll(userId);
    const periods = Array.from(
      new Set(entries.map(e => e.period).filter((p): p is string => p !== null)),
    ).sort();

    const contextText =
      entries.length === 0
        ? "No relevant financial history found."
        : entries.map(e => `[${e.type}] ${e.content}`).join("\n\n");

    const sortedDates = [...entries.map(e => e.createdAt)].sort((a, b) => a.getTime() - b.getTime());
    const now = new Date();

    return Object.freeze({
      userId,
      assembledAt: now,
      query,
      entries,
      contextText,
      metadata: Object.freeze({
        totalEntries,
        entriesConsumed: entries.length,
        oldestEntryDate: sortedDates[0] ?? null,
        newestEntryDate: sortedDates[sortedDates.length - 1] ?? null,
        coversPeriods: Object.freeze(periods),
        retrievalStrategiesUsed: Object.freeze(
          similarityResults.length > 0 ? ["SEMANTIC"] : ["TEMPORAL"],
        ),
        embeddingModel: this.embeddingProvider.model,
        assembledAt: now,
      }),
    });
  }

  async pruneExpired(userId: string): Promise<number> {
    return this.store.deleteExpired(userId);
  }

  async getAll(userId: string, types?: ReadonlyArray<MemoryEntryType>): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    return this.store.getAll(userId, types ? { types } : undefined);
  }
}
