import type { MemoryEntryType } from "./MemoryEntry";
import type { MemoryEmbedding } from "./MemoryEmbedding";

/**
 * The originating snapshot type for a FinancialMemoryEntry.
 * Allows consumers to filter memory by the layer of the pipeline it came from.
 */
export enum FinancialSnapshotType {
  METRICS = "METRICS",
  ANALYTICS = "ANALYTICS",
  INSIGHTS = "INSIGHTS",
  RECOMMENDATIONS = "RECOMMENDATIONS",
  /** EC-012: entries indexed from a FinancialStorySnapshot. */
  STORY = "STORY",
  CONVERSATION = "CONVERSATION",
}

/**
 * A single entry in the Financial Memory store.
 *
 * FinancialMemoryEntry is the richer successor to the legacy MemoryEntry.
 * It is snapshot-aware (snapshotType), tag-indexed, and carries a nullable
 * embedding so that entries can be stored before embedding is computed.
 *
 * The content field is plain prose — it is the text that gets both embedded
 * (for vector search) and injected into an AI prompt's context window.
 */
export interface FinancialMemoryEntry {
  readonly id: string;
  readonly userId: string;
  readonly type: MemoryEntryType;
  readonly snapshotType: FinancialSnapshotType;
  /** Plain prose for embedding and prompt injection. */
  readonly content: string;
  /** Null until the embedding has been computed by a MemoryEmbeddingProvider. */
  readonly embedding: MemoryEmbedding | null;
  /** ISO month the financial data pertains to (e.g. "2025-06"). Null for timeless entries. */
  readonly period: string | null;
  /** Free-form tags for tag-based retrieval (e.g. "debt", "savings", "goal:house"). */
  readonly tags: ReadonlyArray<string>;
  /** Financial categories this entry relates to (e.g. "DEBT", "SAVINGS"). */
  readonly categories: ReadonlyArray<string>;
  /** The id of the originating snapshot, for traceability. Null for conversation notes. */
  readonly sourceSnapshotId: string | null;
  readonly createdAt: Date;
  /** Null means the entry persists indefinitely. */
  readonly expiresAt: Date | null;
}

/**
 * An entry before id, embedding, and createdAt have been assigned.
 * The MemoryIndexer produces drafts; the FinancialMemoryService materialises them.
 */
export type FinancialMemoryEntryDraft = Omit<FinancialMemoryEntry, "id" | "embedding" | "createdAt">;
