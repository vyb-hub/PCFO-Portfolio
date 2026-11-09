/**
 * Provenance and statistics for a FinancialMemoryContext assembly.
 *
 * Metadata is assembled at context-build time and reflects the state
 * of the retrieval — which periods were covered, how many entries
 * were examined, which model produced the embeddings.
 */
export interface FinancialMemoryMetadata {
  /** Total entries in the store for this user at assembly time. */
  readonly totalEntries: number;
  /** Number of entries selected for the context window. */
  readonly entriesConsumed: number;
  /** Earliest createdAt across all selected entries. Null if no entries. */
  readonly oldestEntryDate: Date | null;
  /** Most recent createdAt across all selected entries. Null if no entries. */
  readonly newestEntryDate: Date | null;
  /** Sorted list of ISO-month periods covered by the selected entries. */
  readonly coversPeriods: ReadonlyArray<string>;
  /** Retrieval strategies applied (e.g. ["SEMANTIC", "TEMPORAL"]). */
  readonly retrievalStrategiesUsed: ReadonlyArray<string>;
  /** The embedding model used for the query and for entry retrieval. */
  readonly embeddingModel: string;
  readonly assembledAt: Date;
}
