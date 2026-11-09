import type { MemoryEntry, MemoryEntryType } from "./MemoryEntry";

/**
 * Parameters for a semantic memory retrieval request.
 */
export interface MemoryQuery {
  readonly userId: string;
  /** Natural-language query used to compute a query embedding for similarity search. */
  readonly query: string;
  /** Maximum number of results to return. Defaults to 10. */
  readonly limit?: number;
  /** Restrict results to specific memory types. */
  readonly types?: readonly MemoryEntryType[];
  /** Only return memories created on or after this date. */
  readonly since?: Date;
  /** Minimum similarity score threshold (0–1). Defaults to 0.7. */
  readonly minRelevance?: number;
}

/**
 * A single result from a memory retrieval query.
 */
export interface MemoryQueryResult {
  readonly entry: MemoryEntry;
  /** Cosine similarity score between the query and this entry's embedding (0–1). */
  readonly relevanceScore: number;
}
