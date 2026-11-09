/**
 * Provenance and execution statistics for a FinancialStorySnapshot.
 * Traces back to all four input snapshots StoryEngineInput carries
 * (aggregate has no single timestamp field beyond aggregatedAt).
 */
export interface StoryMetadata {
  readonly userId: string;
  readonly generatedAt: Date;
  readonly aggregatedAt: Date;
  readonly metricsGeneratedAt: Date;
  readonly analyticsAnalyzedAt: Date;
  readonly insightsGeneratedAt: Date;
  readonly recommendationsGeneratedAt: Date;
  /** How many generators ran. */
  readonly generatorsRun: number;
  /** How many generators threw during execution. */
  readonly generatorFailures: number;
  readonly totalStories: number;
  readonly totalBlocks: number;
}
