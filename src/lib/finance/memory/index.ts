// Core entry type
export { MemoryEntryType } from "./MemoryEntry";
export type { MemoryEntry } from "./MemoryEntry";

// EC-009: Financial Memory Platform
export { FinancialSnapshotType } from "./FinancialMemoryEntry";
export type { FinancialMemoryEntry, FinancialMemoryEntryDraft } from "./FinancialMemoryEntry";
export type { FinancialMemoryContext } from "./FinancialMemoryContext";
export type { FinancialMemoryMetadata } from "./FinancialMemoryMetadata";
export type { MemoryEmbedding } from "./MemoryEmbedding";
export type { MemoryEmbeddingProvider } from "./MemoryEmbeddingProvider";
export type { MemoryStore, MemoryStoreFilter, MemorySimilarityResult } from "./MemoryStore";
export type { MemoryIndexer } from "./MemoryIndexer";
export type { MemoryRetriever } from "./MemoryRetriever";
export type { MemorySearchQuery, MemorySearchResult, MemorySearchMatchStrategy } from "./MemorySearch";
export type { IFinancialMemoryService } from "./IFinancialMemoryService";

// Concrete implementations
export { FinancialMemoryService } from "./FinancialMemoryService";
export { DefaultMemoryIndexer } from "./DefaultMemoryIndexer";
export { InMemoryMemoryStore } from "./InMemoryMemoryStore";
export { NullEmbeddingProvider } from "./NullEmbeddingProvider";

// Legacy — kept for backwards compatibility
export type { MemoryQuery, MemoryQueryResult } from "./MemoryQuery";
