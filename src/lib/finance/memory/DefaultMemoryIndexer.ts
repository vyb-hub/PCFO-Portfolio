import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../insights/FinancialInsightSnapshot";
import type { RecommendationSnapshot } from "../recommendations/RecommendationSnapshot";
import type { FinancialStorySnapshot } from "../story/FinancialStorySnapshot";
import type { FinancialMemoryEntryDraft } from "./FinancialMemoryEntry";
import type { MemoryIndexer } from "./MemoryIndexer";
import { FinancialSnapshotType } from "./FinancialMemoryEntry";
import { MemoryEntryType } from "./MemoryEntry";

function formatPeriod(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Same >=0.70 / >=0.40 numeric-to-tier convention used elsewhere (e.g. StoryConfidence.toStoryConfidence). */
function confidenceTierOf(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.70) return "high";
  if (confidence >= 0.40) return "medium";
  return "low";
}

/**
 * Default implementation of MemoryIndexer.
 *
 * Converts immutable financial snapshots into human-readable prose entries
 * that are both embeddable (for vector search) and injectable into AI prompts.
 *
 * Indexing strategy per snapshot type:
 *   - MetricsSnapshot → one summary entry + one entry per unhealthy metric
 *   - AnalyticsSnapshot → one entry per AnalyticsFinding
 *   - FinancialInsightSnapshot → one entry per FinancialInsight
 *   - RecommendationSnapshot → one entry per Recommendation
 *   - FinancialStorySnapshot → one entry per StoryBlock (EC-012)
 *
 * This class has no I/O — it is a pure transformation.
 */
export class DefaultMemoryIndexer implements MemoryIndexer {
  indexMetrics(userId: string, snapshot: FinancialMetricsSnapshot): ReadonlyArray<FinancialMemoryEntryDraft> {
    const period = snapshot.period.label;
    const drafts: FinancialMemoryEntryDraft[] = [];

    const totalMetrics = snapshot.results.length;
    const unhealthyEvals = snapshot.evaluations.filter(e => !e.isHealthy);
    const healthyCount = totalMetrics - unhealthyEvals.length;

    // Summary entry
    const summaryContent =
      `Financial health snapshot for ${period}: ${healthyCount}/${totalMetrics} metrics healthy.` +
      (unhealthyEvals.length > 0
        ? ` Metrics needing attention: ${unhealthyEvals.map(e => e.result.type).join(", ")}.`
        : " All metrics within healthy range.");
    drafts.push({
      userId,
      type: MemoryEntryType.METRICS_SNAPSHOT,
      snapshotType: FinancialSnapshotType.METRICS,
      content: summaryContent,
      period,
      tags: ["metrics-summary"],
      categories: ["FINANCIAL_HEALTH"],
      sourceSnapshotId: null,
      expiresAt: null,
    });

    // One entry per unhealthy metric
    for (const evaluation of unhealthyEvals) {
      const { result, threshold } = evaluation;
      const thresholdDesc = threshold.max !== null
        ? `maximum ${roundTo2(threshold.max)}`
        : threshold.min !== null
          ? `minimum ${roundTo2(threshold.min)}`
          : "no threshold";
      const content =
        `${result.type} was ${roundTo2(result.value)} ${result.unit} in ${period} — ` +
        `outside the healthy range (${thresholdDesc}). ` +
        `Distance from threshold: ${roundTo2(evaluation.distanceFromThreshold)}.`;
      drafts.push({
        userId,
        type: MemoryEntryType.METRICS_SNAPSHOT,
        snapshotType: FinancialSnapshotType.METRICS,
        content,
        period,
        tags: ["metric-unhealthy", `metric:${result.type.toLowerCase()}`],
        categories: [result.definition.category as string],
        sourceSnapshotId: null,
        expiresAt: null,
      });
    }

    return Object.freeze(drafts);
  }

  indexAnalytics(userId: string, snapshot: AnalyticsSnapshot): ReadonlyArray<FinancialMemoryEntryDraft> {
    const period = formatPeriod(snapshot.metadata.analyzedAt);
    return Object.freeze(
      snapshot.findings.map(finding => {
        const directionPart = finding.direction !== null ? `, direction: ${finding.direction}` : "";
        const magnitudePart =
          finding.magnitude !== null
            ? `, magnitude: ${roundTo2(finding.magnitude * 100)}%`
            : "";
        const content =
          `Analytical finding (${finding.type}): ${finding.title}. ` +
          `${finding.description}` +
          `${directionPart}${magnitudePart}. ` +
          `Confidence: ${Math.round(finding.confidence * 100)}%. ` +
          `Based on ${finding.periodsCovered} period(s).`;
        return {
          userId,
          type: MemoryEntryType.ANALYTICS_FINDING,
          snapshotType: FinancialSnapshotType.ANALYTICS,
          content,
          period,
          tags: [
            `finding:${finding.type.toLowerCase()}`,
            finding.metricType !== null ? `metric:${finding.metricType.toLowerCase()}` : "multi-metric",
          ],
          categories: finding.metricType !== null ? [finding.metricType as string] : ["MULTI_METRIC"],
          sourceSnapshotId: null,
          expiresAt: null,
        } satisfies FinancialMemoryEntryDraft;
      }),
    );
  }

  indexInsights(userId: string, snapshot: FinancialInsightSnapshot): ReadonlyArray<FinancialMemoryEntryDraft> {
    const period = formatPeriod(snapshot.generatedAt);
    return Object.freeze(
      snapshot.insights.map(insight => {
        const confidenceTier = confidenceTierOf(insight.confidence);
        const content =
          `${insight.severity} ${insight.type} insight (${insight.category}): ${insight.title}. ` +
          `${insight.summary} ${insight.details} ` +
          `Confidence: ${Math.round(insight.confidence * 100)}%.`;
        return {
          userId,
          type: MemoryEntryType.INSIGHT,
          snapshotType: FinancialSnapshotType.INSIGHTS,
          content,
          period,
          tags: [
            `severity:${insight.severity.toLowerCase()}`,
            `type:${insight.type.toLowerCase()}`,
            `category:${insight.category.toLowerCase()}`,
            `confidence:${confidenceTier}`,
          ],
          categories: [insight.category as string],
          sourceSnapshotId: insight.id,
          expiresAt: null,
        } satisfies FinancialMemoryEntryDraft;
      }),
    );
  }

  indexStory(userId: string, snapshot: FinancialStorySnapshot): ReadonlyArray<FinancialMemoryEntryDraft> {
    const period = formatPeriod(snapshot.generatedAt);
    return Object.freeze(
      snapshot.stories.flatMap(story =>
        story.blocks.map(block => {
          const content =
            `${block.priority} story (${block.category} — ${block.blockType}): ${block.title}. ` +
            `${block.summary} ${block.explanation} ${block.userImpact}`;
          return {
            userId,
            type: MemoryEntryType.STORY_BLOCK,
            snapshotType: FinancialSnapshotType.STORY,
            content,
            period,
            tags: [
              `priority:${block.priority.toLowerCase()}`,
              `blocktype:${block.blockType.toLowerCase()}`,
              `category:${block.category.toLowerCase()}`,
              `confidence:${block.confidence.toLowerCase()}`,
            ],
            categories: [block.category as string],
            sourceSnapshotId: block.id,
            expiresAt: null,
          } satisfies FinancialMemoryEntryDraft;
        }),
      ),
    );
  }

  indexRecommendations(userId: string, snapshot: RecommendationSnapshot): ReadonlyArray<FinancialMemoryEntryDraft> {
    const period = formatPeriod(snapshot.metadata.generatedAt);
    return Object.freeze(
      snapshot.recommendations.map(rec => {
        const content =
          `${rec.priority} recommendation (${rec.category}): ${rec.title}. ` +
          `${rec.rationale} ` +
          `Suggested action: ${rec.action}. ` +
          `Confidence: ${rec.confidence}.`;
        return {
          userId,
          type: MemoryEntryType.RECOMMENDATION,
          snapshotType: FinancialSnapshotType.RECOMMENDATIONS,
          content,
          period,
          tags: [
            `priority:${rec.priority.toLowerCase()}`,
            `action:${rec.action.toLowerCase()}`,
            `category:${rec.category.toLowerCase()}`,
          ],
          categories: [rec.category as string],
          sourceSnapshotId: null,
          expiresAt: null,
        } satisfies FinancialMemoryEntryDraft;
      }),
    );
  }
}
