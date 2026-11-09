/**
 * Shared test fixtures for the Conversation Platform test suite.
 *
 * Reuses fixture builders from earlier layers (same cross-module re-export
 * idiom as reviews/__tests__/testHelpers.ts).
 */
import type { ConversationEngineInput } from "../ConversationEngineInput";
import { FinancialReviewBuilder } from "../../reviews/FinancialReviewBuilder";

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

export { makeStoryBlock, makeFinancialStorySnapshot } from "../../memory/__tests__/testHelpers";

import { makeInsightSnapshot } from "../../recommendations/__tests__/testHelpers";
import { makeRecommendationSnapshot as buildRecSnapshot } from "../../reviews/__tests__/testHelpers";
import { makeFinancialStorySnapshot as buildStorySnapshot } from "../../memory/__tests__/testHelpers";
import type { FinancialInsight } from "../../insights/FinancialInsight";
import type { Recommendation } from "../../recommendations/Recommendation";
import type { StoryBlock } from "../../story/StoryBlock";
import { makeEvaluation, makeSnapshot as makeMetricsSnapshot } from "../../insights/__tests__/testHelpers";
import { MetricType, MetricUnit } from "../../metrics/MetricType";

/**
 * A complete, internally-consistent ConversationEngineInput: a real
 * FinancialReview assembled (via FinancialReviewBuilder, no shortcuts) from
 * the given insights/recommendations, plus a story snapshot built from the
 * given story blocks.
 */
export function makeConversationEngineInput(
  userId: string,
  options: {
    insights?: ReadonlyArray<FinancialInsight>;
    recommendations?: ReadonlyArray<Recommendation>;
    storyBlocks?: ReadonlyArray<StoryBlock>;
  } = {},
): ConversationEngineInput {
  const insights = options.insights ?? [];
  const recommendations = options.recommendations ?? [];
  const storyBlocks = options.storyBlocks ?? [];

  const metricsSnapshot = makeMetricsSnapshot(userId, [
    makeEvaluation(MetricType.SAVINGS_RATE, 0.12, { min: 0.10, max: null, optimal: null, description: "" }, true, 0.02, MetricUnit.PERCENTAGE),
  ]);
  const insightSnapshot = makeInsightSnapshot(userId, [...insights]);
  const recommendationSnapshot = buildRecSnapshot(userId, [...recommendations]);
  const storySnapshot = buildStorySnapshot(userId, storyBlocks);

  const review = new FinancialReviewBuilder().build(metricsSnapshot, insightSnapshot, recommendationSnapshot);

  return { userId, storySnapshot, review, insightSnapshot, recommendationSnapshot };
}
