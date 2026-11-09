import type { MemoryEmbedding } from "./MemoryEmbedding";

/**
 * Provider-agnostic interface for computing embedding vectors.
 *
 * Concrete implementations live outside src/lib/finance/ (e.g. in src/lib/ai/)
 * so that the Memory Platform remains AI-provider agnostic.
 *
 * Supported future providers:
 *   - GeminiEmbeddingProvider    (text-embedding-004, 768 dims)
 *   - OpenAIEmbeddingProvider    (text-embedding-3-small, 1536 dims)
 *   - LocalEmbeddingProvider     (onnx-bert, variable dims)
 *   - NullEmbeddingProvider      (zero-vector stub for dev/testing)
 */
export interface MemoryEmbeddingProvider {
  /** Identifier string for the underlying model (e.g. "text-embedding-004"). */
  readonly model: string;
  /** Dimensionality of vectors produced by this provider. */
  readonly dimensions: number;

  /** Embed a single text string. */
  embed(text: string): Promise<MemoryEmbedding>;

  /** Embed multiple text strings in a single provider round-trip. */
  embedBatch(texts: readonly string[]): Promise<ReadonlyArray<MemoryEmbedding>>;
}
