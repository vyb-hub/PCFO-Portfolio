/**
 * Shared test fixtures for the Financial Review Engine test suite.
 */
import type { RecommendationSnapshot } from "../../recommendations/RecommendationSnapshot";
import type { Recommendation } from "../../recommendations/Recommendation";
import { RecommendationPriority } from "../../recommendations/RecommendationPriority";
import { RecommendationCategory } from "../../recommendations/RecommendationCategory";
import { RecommendationAction } from "../../recommendations/RecommendationAction";
import { RecommendationConfidence } from "../../recommendations/RecommendationConfidence";
import { AggregateGranularity } from "../../aggregation/AggregatePeriod";
import { MetricType, MetricUnit } from "../../metrics/MetricType";

export {
  makeEvaluation,
  makeSnapshot as makeMetricsSnapshot,
  makeThreshold,
} from "../../insights/__tests__/testHelpers";

export {
  makeInsight,
  makeInsightSnapshot,
} from "../../recommendations/__tests__/testHelpers";

const NOW = new Date("2026-06-01T00:00:00Z");

export const PERIOD = {
  range: { start: new Date("2026-06-01"), end: new Date("2026-06-30") },
  label: "2026-06",
  granularity: AggregateGranularity.MONTHLY,
};

export function makeRecommendation(
  id: string,
  category: RecommendationCategory,
  priority: RecommendationPriority,
  action: RecommendationAction = RecommendationAction.INCREASE_SAVINGS,
): Recommendation {
  return {
    id,
    category,
    priority,
    action,
    title:                 id,
    rationale:             id,
    impacts:               [],
    confidence:            RecommendationConfidence.HIGH,
    supportingInsightIds:  [],
    supportingFindingIds:  [],
    supportingMetricTypes: [],
    generatedAt:           NOW,
  };
}

export function makeRecommendationSnapshot(
  userId: string,
  recommendations: Recommendation[],
): RecommendationSnapshot {
  const critical = recommendations.filter((r) => r.priority === RecommendationPriority.CRITICAL).length;
  const high     = recommendations.filter((r) => r.priority === RecommendationPriority.HIGH).length;
  const medium   = recommendations.filter((r) => r.priority === RecommendationPriority.MEDIUM).length;
  const low      = recommendations.filter((r) => r.priority === RecommendationPriority.LOW).length;
  return {
    userId,
    metadata: {
      userId,
      generatedAt:          NOW,
      metricsGeneratedAt:   NOW,
      analyticsAnalyzedAt:  NOW,
      insightsGeneratedAt:  NOW,
      generatorsRun:        recommendations.length,
      generatorFailures:    0,
      totalRecommendations: recommendations.length,
      criticalRecommendations: critical,
      highRecommendations:     high,
      mediumRecommendations:   medium,
      lowRecommendations:      low,
    },
    recommendations,
    failures: [],
  };
}
