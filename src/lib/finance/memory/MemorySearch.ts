import type { DateRange } from "../types/DateRange";
import type { FinancialMemoryEntry, FinancialSnapshotType } from "./FinancialMemoryEntry";
import type { MemoryEntryType } from "./MemoryEntry";

/**
 * Parameters for a Financial Memory search request.
 *
 * Providing `text` triggers semantic (vector) search.
 * Without `text`, the search falls back to deterministic filter-based retrieval
 * using whichever of the other fields are set.
 */
export interface MemorySearchQuery {
  readonly userId: string;
  /** Natural-language query string. Triggers embedding + vector search when provided. */
  readonly text?: string;
  /** Exact ISO-month match (e.g. "2025-06"). */
  readonly period?: string;
  readonly dateRange?: DateRange;
  readonly categories?: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly types?: ReadonlyArray<MemoryEntryType>;
  readonly snapshotTypes?: ReadonlyArray<FinancialSnapshotType>;
  /** Only entries created on or after this date. */
  readonly since?: Date;
  /** Maximum results to return. Defaults to 10. */
  readonly limit?: number;
  /** Minimum similarity score for semantic results (0–1). Defaults to 0.7. */
  readonly minRelevance?: number;
}

/** Which strategy produced a given MemorySearchResult. */
export type MemorySearchMatchStrategy =
  | "SEMANTIC"
  | "TEMPORAL"
  | "CATEGORY"
  | "TAG"
  | "COMBINED";

/**
 * A single result from a memory search.
 */
export interface MemorySearchResult {
  readonly entry: FinancialMemoryEntry;
  /**
   * Similarity score for semantic results (0–1).
   * 1.0 for filter-based results (relevance is binary — it matched or it didn't).
   */
  readonly relevanceScore: number;
  readonly matchedBy: MemorySearchMatchStrategy;
}
