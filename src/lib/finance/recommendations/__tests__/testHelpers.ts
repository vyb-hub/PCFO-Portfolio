/**
 * Shared test fixtures for the Recommendation Generator test suite.
 *
 * Re-exports MetricsSnapshot builder from the insights test suite;
 * adds AnalyticsSnapshot and FinancialInsightSnapshot builders.
 */
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { AnalyticsFinding } from "../../analytics/AnalyticsFinding";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { FinancialInsight } from "../../insights/FinancialInsight";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { AggregateGranularity } from "../../aggregation/AggregatePeriod";
import { FINANCIAL_INSIGHT_SNAPSHOT_VERSION } from "../../insights/FinancialInsightSnapshot";

export {
  makeEvaluation,
  makeSnapshot as makeMetricsSnapshot,
  makeThreshold,
} from "../../insights/__tests__/testHelpers";

const NOW = new Date("2026-06-01T00:00:00Z");
const ANALYSIS_WINDOW = { start: new Date("2026-01-01"), end: new Date("2026-06-30") };

export function makeFinding(
  id: string,
  type: AnalysisFindingType,
  metricType: MetricType | null = null,
  direction: import("../../analytics/TrendDirection").TrendDirection | null = null,
): AnalyticsFinding {
  return {
    id,
    type,
    metricType,
    title:            id,
    description:      id,
    direction,
    magnitude:        null,
    confidence:       0.80,
    periodsCovered:   3,
    supportingValues: [],
    detectedAt:       NOW,
  };
}

export function makeAnalyticsSnapshot(
  userId: string,
  findings: AnalyticsFinding[],
): AnalyticsSnapshot {
  return {
    userId,
    analysisWindow: ANALYSIS_WINDOW,
    metadata: {
      userId,
      analyzedAt:       NOW,
      snapshotsAnalyzed: 3,
      analyzersRun:      4,
      analyzersSkipped:  0,
      analyzerFailures:  0,
      totalFindings:     findings.length,
    },
    findings,
    failures: [],
  };
}

export function makeInsight(
  id: string,
  category: InsightMetricCategory,
  type: InsightType,
  severity: InsightSeverityLevel = InsightSeverityLevel.MEDIUM,
  confidence = 0.80,
  metric: MetricType = MetricType.SAVINGS_RATE,
  text: Partial<Pick<FinancialInsight, "title" | "summary" | "details">> = {},
): FinancialInsight {
  return {
    id,
    metric,
    category,
    type,
    severity,
    title:            text.title ?? id,
    summary:          text.summary ?? id,
    details:          text.details ?? id,
    confidence,
    supportingMetrics: [],
    supportingTrends:  [],
    createdAt:         NOW,
  };
}

export function makeInsightSnapshot(
  userId: string,
  insights: FinancialInsight[],
): FinancialInsightSnapshot {
  const critical = insights.filter(i => i.severity === InsightSeverityLevel.CRITICAL).length;
  const high     = insights.filter(i => i.severity === InsightSeverityLevel.HIGH).length;
  const risks    = insights.filter(i => i.type === InsightType.RISK).length;
  const warnings = insights.filter(i => i.type === InsightType.WARNING).length;
  return {
    userId,
    generatedAt:     NOW,
    snapshotVersion: FINANCIAL_INSIGHT_SNAPSHOT_VERSION,
    insights,
    summary: {
      totalInsights:   insights.length,
      positiveInsights: insights.filter(i => i.type === InsightType.POSITIVE).length,
      warnings,
      risks,
      criticalIssues:  critical,
      opportunities:   insights.filter(i => i.type === InsightType.OPPORTUNITY).length,
      milestones:      insights.filter(i => i.type === InsightType.MILESTONE).length,
      overallFinancialHealthNarrative: "Test snapshot.",
    },
    statistics: {
      metricsAnalyzed:       insights.length,
      metricsWithTrends:     0,
      averageConfidence:     insights.length > 0
        ? insights.reduce((s, i) => s + i.confidence, 0) / insights.length
        : 0,
      highestSeverityFound:  critical > 0 ? InsightSeverityLevel.CRITICAL
        : high > 0           ? InsightSeverityLevel.HIGH
        : insights.length > 0 ? InsightSeverityLevel.MEDIUM
        : null,
      categoriesCovered:     [...new Set(insights.map(i => i.category))],
    },
    metadata: {
      userId,
      generatedAt:     NOW,
      generatorsRun:   1,
      generatorFailures: 0,
      metricsConsumed: insights.length,
      trendsConsumed:  0,
    },
    failures: [],
  };
}
