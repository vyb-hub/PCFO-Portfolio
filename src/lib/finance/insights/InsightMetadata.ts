/**
 * Provenance and execution statistics for an InsightSnapshot.
 */
export interface InsightMetadata {
  readonly userId: string;
  readonly generatedAt: Date;
  /** Total AnalyticsFinding objects consumed from the source AnalyticsSnapshot. */
  readonly findingsConsumed: number;
  /** How many generators ran (those registered in the engine). */
  readonly generatorsRun: number;
  /** How many generators threw during execution. */
  readonly generatorFailures: number;
  readonly totalInsights: number;
  readonly criticalInsights: number;
  readonly warningInsights: number;
  readonly infoInsights: number;
}
