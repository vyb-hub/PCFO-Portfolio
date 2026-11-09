import type { FinancialMemoryEntry } from "./FinancialMemoryEntry";
import type { FinancialMemoryMetadata } from "./FinancialMemoryMetadata";

/**
 * The assembled historical financial context produced for a downstream AI consumer.
 *
 * FinancialMemoryContext is the primary output of the Financial Memory Platform.
 * The AI Coach (and future consumers) call IFinancialMemoryService.assembleContext()
 * and inject contextText into their prompt's context window.
 *
 * The raw entries array is also provided so consumers can render structured
 * memory UI or apply their own selection logic.
 *
 * The Memory Platform never calls the AI Coach. It only prepares context.
 */
export interface FinancialMemoryContext {
  readonly userId: string;
  readonly assembledAt: Date;
  /** The natural-language query that drove the retrieval. */
  readonly query: string;
  /**
   * Most relevant entries, ordered by relevance score descending.
   * Count is bounded by the windowSize passed to assembleContext().
   */
  readonly entries: ReadonlyArray<FinancialMemoryEntry>;
  /**
   * Compact prose block ready for direct injection into an AI prompt.
   * Each entry is formatted as "[TYPE] {content}" separated by double newlines.
   * Returns "No relevant financial history found." when entries is empty.
   */
  readonly contextText: string;
  readonly metadata: FinancialMemoryMetadata;
}
