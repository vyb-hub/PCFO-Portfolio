/**
 * Shared test fixtures for the Financial Memory Platform test suite.
 *
 * Reuses FinancialInsight/FinancialInsightSnapshot fixtures already defined
 * in recommendations/__tests__/testHelpers.ts rather than duplicating them —
 * only StoryBlock/FinancialStorySnapshot fixtures are genuinely new here.
 */
import type { FinancialStorySnapshot } from "../../story/FinancialStorySnapshot";
import type { StoryBlock } from "../../story/StoryBlock";
import { StoryCategory } from "../../story/StoryCategory";
import { StoryBlockType } from "../../story/StoryBlockType";
import { StoryPriority } from "../../story/StoryPriority";
import { StoryConfidence } from "../../story/StoryConfidence";
import { EMPTY_STORY_EVIDENCE } from "../../story/StoryEvidence";
import { FINANCIAL_STORY_SNAPSHOT_VERSION } from "../../story/FinancialStorySnapshot";
import { AggregateGranularity } from "../../aggregation/AggregatePeriod";

export {
  makeInsight as makeFinancialInsight,
  makeInsightSnapshot as makeFinancialInsightSnapshot,
} from "../../recommendations/__tests__/testHelpers";

const NOW = new Date("2026-06-01T00:00:00Z");

export const PERIOD = {
  range: { start: new Date("2026-06-01"), end: new Date("2026-06-30") },
  label: "2026-06",
  granularity: AggregateGranularity.MONTHLY,
};

export function makeStoryBlock(overrides: Partial<StoryBlock> = {}): StoryBlock {
  return Object.freeze({
    id: "block-1",
    title: "Largest Expense This Month",
    category: StoryCategory.CASH_FLOW,
    blockType: StoryBlockType.LARGEST_EXPENSE,
    priority: StoryPriority.HIGH,
    confidence: StoryConfidence.HIGH,
    summary: "₹18,500 to Amazon on 14 June was your biggest single expense this month.",
    explanation: "This transaction accounts for 40% of everything you spent this period.",
    userImpact: "Worth knowing whether this was planned or one-off.",
    recommendedAction: "If this recurs, consider budgeting for it ahead of time.",
    supportingMetrics: Object.freeze([]),
    supportingInsights: Object.freeze([]),
    supportingRecommendations: Object.freeze([]),
    evidence: EMPTY_STORY_EVIDENCE,
    metadata: Object.freeze({}),
    generatedAt: NOW,
    ...overrides,
  });
}

export function makeFinancialStorySnapshot(
  userId: string,
  blocks: ReadonlyArray<StoryBlock>,
): FinancialStorySnapshot {
  return {
    userId,
    generatedAt: NOW,
    snapshotVersion: FINANCIAL_STORY_SNAPSHOT_VERSION,
    stories: blocks.length > 0
      ? [{
          id: "story-1",
          userId,
          category: StoryCategory.CASH_FLOW,
          period: PERIOD,
          title: "Cash Flow",
          blocks,
          generatedAt: NOW,
          metadata: { blockCount: blocks.length },
        }]
      : [],
    failures: [],
    metadata: {
      userId,
      generatedAt: NOW,
      aggregatedAt: NOW,
      metricsGeneratedAt: NOW,
      analyticsAnalyzedAt: NOW,
      insightsGeneratedAt: NOW,
      recommendationsGeneratedAt: NOW,
      generatorsRun: 1,
      generatorFailures: 0,
      totalStories: blocks.length > 0 ? 1 : 0,
      totalBlocks: blocks.length,
    },
  };
}
