import type { FinancialMemoryEntry, FinancialSnapshotType } from "./FinancialMemoryEntry";
import type { MemoryEntryType } from "./MemoryEntry";

/**
 * Filter parameters for getAll() queries.
 * All fields are optional — unset fields are not applied as filters.
 */
export interface MemoryStoreFilter {
  readonly types?: ReadonlyArray<MemoryEntryType>;
  readonly snapshotTypes?: ReadonlyArray<FinancialSnapshotType>;
  /** Only entries created on or after this date. */
  readonly since?: Date;
  /** Exact ISO-month period match (e.g. "2025-06"). */
  readonly period?: string;
  /** Any-of match — entries that contain at least one of these tags. */
  readonly tags?: ReadonlyArray<string>;
  /** Any-of match — entries that contain at least one of these categories. */
  readonly categories?: ReadonlyArray<string>;
}

/**
 * A single result from a vector similarity search.
 */
export interface MemorySimilarityResult {
  readonly entry: FinancialMemoryEntry;
  /** Cosine similarity between the query vector and this entry's embedding (0–1). */
  readonly score: number;
}

/**
 * Storage abstraction for the Financial Memory Platform.
 *
 * Implementations must support:
 *   - Exact-match filter retrieval (getAll with MemoryStoreFilter)
 *   - Approximate nearest-neighbour vector search (findBySimilarity)
 *   - TTL-aware expiry (deleteExpired)
 *
 * Provided implementations:
 *   - InMemoryMemoryStore  — in-process store with JS cosine similarity (dev/testing)
 *
 * Future implementations:
 *   - PgVectorMemoryStore  — Postgres with pgvector extension
 *   - PineconeMemoryStore  — Pinecone managed vector database
 *   - WeaviateMemoryStore  — Weaviate self-hosted vector DB
 */
export interface MemoryStore {
  /** Persist a fully-materialised entry (with embedding). */
  save(entry: FinancialMemoryEntry): Promise<void>;

  /** Retrieve a single entry by id, scoped to userId. Returns null if not found or mismatched. */
  getById(id: string, userId: string): Promise<FinancialMemoryEntry | null>;

  /** Retrieve all entries for a user, newest first, with optional filter. */
  getAll(userId: string, filter?: MemoryStoreFilter): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Nearest-neighbour search on stored embedding vectors.
   * Returns at most `limit` results with score >= `minScore`, ordered score descending.
   * Entries with null embeddings are excluded.
   */
  findBySimilarity(
    userId: string,
    queryVector: readonly number[],
    limit: number,
    minScore: number,
  ): Promise<ReadonlyArray<MemorySimilarityResult>>;

  /** Delete all entries past their expiresAt. Returns the number deleted. */
  deleteExpired(userId: string): Promise<number>;

  /** Count all entries for a user regardless of filter. */
  countAll(userId: string): Promise<number>;
}
