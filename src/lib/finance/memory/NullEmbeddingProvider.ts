import type { MemoryEmbedding } from "./MemoryEmbedding";
import type { MemoryEmbeddingProvider } from "./MemoryEmbeddingProvider";

/**
 * A no-op embedding provider that returns zero-dimension vectors.
 *
 * Used as the default when no real embedding provider is configured.
 * Similarity search against null-provider vectors always returns score 0,
 * so assembleContext() falls back to returning the most recent entries.
 *
 * Replace with a real provider (GeminiEmbeddingProvider, OpenAIEmbeddingProvider)
 * at the DI wiring layer once an embedding API is configured.
 */
export class NullEmbeddingProvider implements MemoryEmbeddingProvider {
  readonly model = "null";
  readonly dimensions = 0;

  async embed(_text: string): Promise<MemoryEmbedding> {
    return { vector: Object.freeze([]), model: this.model, dimensions: 0, generatedAt: new Date() };
  }

  async embedBatch(texts: readonly string[]): Promise<ReadonlyArray<MemoryEmbedding>> {
    return Object.freeze(
      texts.map(() => ({
        vector: Object.freeze([]) as readonly number[],
        model: this.model,
        dimensions: 0,
        generatedAt: new Date(),
      })),
    );
  }
}
