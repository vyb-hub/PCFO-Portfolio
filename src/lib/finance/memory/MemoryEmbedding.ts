/**
 * An embedding vector with provenance metadata.
 *
 * The vector itself is opaque — the Memory Platform never inspects
 * individual dimensions. Cosine similarity and dot-product operations
 * are computed on the full vector by the MemoryStore.
 *
 * The model and dimensions fields allow the store to reject
 * mismatched vectors (e.g. a 768-dim vector stored against a
 * 1536-dim index would silently produce wrong similarity scores).
 */
export interface MemoryEmbedding {
  readonly vector: readonly number[];
  readonly model: string;
  readonly dimensions: number;
  readonly generatedAt: Date;
}
