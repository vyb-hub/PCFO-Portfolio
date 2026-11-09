import type { FinancialInsight } from "./FinancialInsight";
import type { FinancialInsightSummary } from "./FinancialInsightSummary";
import type { FinancialInsightStatistics } from "./FinancialInsightStatistics";
import type { FinancialInsightMetadata } from "./FinancialInsightMetadata";
import type { FinancialInsightGeneratorType } from "./FinancialInsightGeneratorType";

export interface FinancialInsightGenerationFailure {
  readonly generatorId: FinancialInsightGeneratorType;
  readonly errorMessage: string;
  readonly failedAt: Date;
}

/**
 * The complete output of a FinancialInsightEngine run.
 *
 * Insights are sorted by severity descending (CRITICAL → LOW) then
 * by type (RISK → WARNING → OPPORTUNITY → POSITIVE → NEUTRAL → MILESTONE).
 *
 * Distinct from the legacy InsightSnapshot used by the analytics-pipeline system.
 */
export interface FinancialInsightSnapshot {
  readonly userId: string;
  readonly generatedAt: Date;
  /** Semver string; increment when the snapshot schema changes. */
  readonly snapshotVersion: string;
  readonly insights: ReadonlyArray<FinancialInsight>;
  readonly summary: FinancialInsightSummary;
  readonly statistics: FinancialInsightStatistics;
  readonly metadata: FinancialInsightMetadata;
  readonly failures: ReadonlyArray<FinancialInsightGenerationFailure>;
}

export const FINANCIAL_INSIGHT_SNAPSHOT_VERSION = "1.0.0" as const;
