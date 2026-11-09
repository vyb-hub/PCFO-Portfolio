import type { DateRange } from "../types/DateRange";
import type { RecommendationAction } from "../recommendations/RecommendationAction";
import type { FinancialMemoryEntry } from "./FinancialMemoryEntry";
import type { MemorySearchResult } from "./MemorySearch";

/**
 * Multi-strategy retrieval interface for the Financial Memory Platform.
 *
 * Each method represents a distinct retrieval strategy. Strategies can be
 * composed by the FinancialMemoryService when assembling a FinancialMemoryContext
 * (e.g. temporal + semantic fusion).
 *
 * All retrieval is deterministic — no AI calls, no randomness.
 * Semantic retrieval (bySimilarity) requires a pre-computed query vector;
 * embedding computation is the caller's responsibility.
 */
export interface MemoryRetriever {
  /** Retrieve all entries for an ISO-month period (e.g. "2025-06"). */
  byTimePeriod(userId: string, period: string): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /** Retrieve all entries whose createdAt falls within the given date range. */
  byDateRange(userId: string, range: DateRange): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /** Retrieve all entries whose categories array contains the given category. */
  byCategory(userId: string, category: string): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Retrieve entries that were indexed from a recommendation with the given action.
   * Matches on tags (format: "action:{RecommendationAction}").
   */
  byRecommendationAction(userId: string, action: RecommendationAction): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /** Retrieve entries that contain all of the given tags (AND semantics). */
  byTags(userId: string, tags: ReadonlyArray<string>): Promise<ReadonlyArray<FinancialMemoryEntry>>;

  /**
   * Nearest-neighbour search using a pre-computed query vector.
   * limit defaults to 10; minScore defaults to 0.7.
   */
  bySimilarity(
    userId: string,
    queryVector: readonly number[],
    limit?: number,
    minScore?: number,
  ): Promise<ReadonlyArray<MemorySearchResult>>;
}
