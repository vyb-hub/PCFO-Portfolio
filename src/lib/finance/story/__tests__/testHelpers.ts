/**
 * Shared test fixtures for the Story Engine test suite.
 *
 * Re-exports snapshot builders from earlier layers (same cross-module
 * re-export idiom as reviews/__tests__/testHelpers.ts) and adds a
 * FinancialAggregate + TransactionRecord builder for story/-specific fixtures.
 */
import type { TransactionRecord, TransactionRecordType } from "../../types/TransactionRecord";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";
import type { StoryEngineInput } from "../StoryEngineInput";
import type { StoryBlock } from "../StoryBlock";
import { AggregateGranularity } from "../../aggregation/AggregatePeriod";
import { FinancialAggregateBuilder } from "../../aggregation/FinancialAggregateBuilder";
import { MoneyUtils } from "../../utils/MoneyUtils";
import { StoryCategory } from "../StoryCategory";
import { StoryBlockType } from "../StoryBlockType";
import { StoryPriority } from "../StoryPriority";
import { StoryConfidence } from "../StoryConfidence";
import { EMPTY_STORY_EVIDENCE } from "../StoryEvidence";

export {
  makeEvaluation,
  makeSnapshot as makeMetricsSnapshot,
  makeThreshold,
} from "../../insights/__tests__/testHelpers";

export {
  makeFinding,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "../../recommendations/__tests__/testHelpers";

export {
  makeRecommendation,
  makeRecommendationSnapshot,
} from "../../reviews/__tests__/testHelpers";

const NOW = new Date("2026-06-01T00:00:00Z");

export const PERIOD = {
  range: { start: new Date("2026-06-01"), end: new Date("2026-06-30") },
  label: "2026-06",
  granularity: AggregateGranularity.MONTHLY,
};

let txnCounter = 0;

export function makeTransaction(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  txnCounter++;
  return {
    id: overrides.id ?? `txn-${txnCounter}`,
    userId: "u1",
    amount: { amount: 1000, currency: "INR" },
    type: "DEBIT" as TransactionRecordType,
    category: "shopping",
    subcategory: null,
    description: `Transaction ${txnCounter}`,
    merchant: null,
    account: "acc-1",
    date: new Date("2026-06-15"),
    isRecurring: false,
    recurringId: null,
    ...overrides,
  };
}

export function makeAggregate(
  userId: string,
  transactions: ReadonlyArray<TransactionRecord>,
): FinancialAggregate {
  return new FinancialAggregateBuilder()
    .forUser(userId)
    .forPeriod(PERIOD)
    .withTransactions(transactions)
    .build();
}

/**
 * A minimal but complete StoryEngineInput: an aggregate built from the
 * given transactions plus empty metrics/analytics/insights/recommendations
 * snapshots. Sufficient for generators that only read `aggregate` (like
 * CashFlowLargestExpenseGenerator); pass overrides for generators that need
 * populated upstream snapshots.
 */
export function makeStoryEngineInput(
  userId: string,
  transactions: ReadonlyArray<TransactionRecord>,
  overrides: Partial<StoryEngineInput> = {},
): StoryEngineInput {
  const aggregate = overrides.aggregate ?? makeAggregate(userId, transactions);
  return {
    aggregate,
    metricsSnapshot: overrides.metricsSnapshot ?? {
      userId,
      period: PERIOD,
      metadata: {
        userId,
        generatedAt: NOW,
        aggregatedAt: NOW,
        version: { major: 1, minor: 0, patch: 0 },
        totalAttempted: 0,
        successfulMetrics: 0,
        failedMetrics: 0,
      },
      results: [],
      evaluations: [],
      failures: [],
      definitions: [],
    },
    analyticsSnapshot: overrides.analyticsSnapshot ?? {
      userId,
      analysisWindow: { start: PERIOD.range.start, end: PERIOD.range.end },
      metadata: {
        userId,
        analyzedAt: NOW,
        snapshotsAnalyzed: 1,
        analyzersRun: 0,
        analyzersSkipped: 0,
        analyzerFailures: 0,
        totalFindings: 0,
      },
      findings: [],
      failures: [],
    },
    insightSnapshot: overrides.insightSnapshot ?? {
      userId,
      generatedAt: NOW,
      snapshotVersion: "1.0.0",
      insights: [],
      summary: {
        totalInsights: 0,
        positiveInsights: 0,
        warnings: 0,
        risks: 0,
        criticalIssues: 0,
        opportunities: 0,
        milestones: 0,
        overallFinancialHealthNarrative: "",
      },
      statistics: {
        metricsAnalyzed: 0,
        metricsWithTrends: 0,
        averageConfidence: 0,
        highestSeverityFound: null,
        categoriesCovered: [],
      },
      metadata: {
        userId,
        generatedAt: NOW,
        generatorsRun: 0,
        generatorFailures: 0,
        metricsConsumed: 0,
        trendsConsumed: 0,
      },
      failures: [],
    },
    recommendationSnapshot: overrides.recommendationSnapshot ?? {
      userId,
      metadata: {
        userId,
        generatedAt: NOW,
        metricsGeneratedAt: NOW,
        analyticsAnalyzedAt: NOW,
        insightsGeneratedAt: NOW,
        generatorsRun: 0,
        generatorFailures: 0,
        totalRecommendations: 0,
        criticalRecommendations: 0,
        highRecommendations: 0,
        mediumRecommendations: 0,
        lowRecommendations: 0,
      },
      recommendations: [],
      failures: [],
    },
  };
}

export function money(amount: number, currency = "INR") {
  return MoneyUtils.make(amount, currency);
}

export function makeStoryBlock(overrides: Partial<StoryBlock> = {}): StoryBlock {
  return Object.freeze({
    id: overrides.id ?? `block-${++txnCounter}`,
    title: "Test Block",
    category: StoryCategory.CASH_FLOW,
    blockType: StoryBlockType.LARGEST_EXPENSE,
    priority: StoryPriority.MEDIUM,
    confidence: StoryConfidence.HIGH,
    summary: "summary",
    explanation: "explanation",
    userImpact: "userImpact",
    recommendedAction: "recommendedAction",
    supportingMetrics: Object.freeze([]),
    supportingInsights: Object.freeze([]),
    supportingRecommendations: Object.freeze([]),
    evidence: EMPTY_STORY_EVIDENCE,
    metadata: Object.freeze({}),
    generatedAt: NOW,
    ...overrides,
  });
}
