import type { FinancialMemoryEntry, FinancialSnapshotType } from "./FinancialMemoryEntry";
import type { MemoryEntryType } from "./MemoryEntry";
import type { MemorySimilarityResult, MemoryStore, MemoryStoreFilter } from "./MemoryStore";

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] as number;
    const bi = b[i] as number;
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function matchesFilter(entry: FinancialMemoryEntry, filter: MemoryStoreFilter): boolean {
  if (filter.types?.length && !filter.types.includes(entry.type)) return false;
  if (filter.snapshotTypes?.length && !filter.snapshotTypes.includes(entry.snapshotType)) return false;
  if (filter.since && entry.createdAt < filter.since) return false;
  if (filter.period && entry.period !== filter.period) return false;
  if (filter.tags?.length && !filter.tags.some(t => entry.tags.includes(t))) return false;
  if (filter.categories?.length && !filter.categories.some(c => entry.categories.includes(c))) return false;
  return true;
}

/**
 * In-process memory store backed by a Map.
 *
 * Uses JavaScript cosine similarity for vector search — suitable for
 * development and testing where a managed vector database is not available.
 * Replace with PgVectorMemoryStore or PineconeMemoryStore for production.
 *
 * Thread safety: not safe for concurrent server-side use across requests.
 * Each Next.js serverless invocation gets its own instance, so state is
 * not shared — this is intentional for the dev/testing use case.
 */
export class InMemoryMemoryStore implements MemoryStore {
  private readonly entries = new Map<string, FinancialMemoryEntry>();

  async save(entry: FinancialMemoryEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async getById(id: string, userId: string): Promise<FinancialMemoryEntry | null> {
    const entry = this.entries.get(id);
    return entry !== undefined && entry.userId === userId ? entry : null;
  }

  async getAll(userId: string, filter?: MemoryStoreFilter): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    let results = Array.from(this.entries.values()).filter(e => e.userId === userId);
    if (filter) {
      results = results.filter(e => matchesFilter(e, filter));
    }
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Object.freeze(results);
  }

  async findBySimilarity(
    userId: string,
    queryVector: readonly number[],
    limit: number,
    minScore: number,
  ): Promise<ReadonlyArray<MemorySimilarityResult>> {
    const candidates = Array.from(this.entries.values()).filter(
      e => e.userId === userId && e.embedding !== null,
    );
    const scored: MemorySimilarityResult[] = candidates
      .map(entry => ({
        entry,
        score: cosineSimilarity(queryVector, entry.embedding!.vector),
      }))
      .filter(r => r.score >= minScore);
    scored.sort((a, b) => b.score - a.score);
    return Object.freeze(scored.slice(0, limit));
  }

  async deleteExpired(userId: string): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, entry] of this.entries) {
      if (entry.userId === userId && entry.expiresAt !== null && entry.expiresAt <= now) {
        this.entries.delete(id);
        count++;
      }
    }
    return count;
  }

  async countAll(userId: string): Promise<number> {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.userId === userId) count++;
    }
    return count;
  }
}
