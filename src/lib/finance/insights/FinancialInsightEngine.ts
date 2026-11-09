import type { IFinancialInsightEngine } from "./IFinancialInsightEngine";
import type { FinancialInsightSnapshot, FinancialInsightGenerationFailure } from "./FinancialInsightSnapshot";
import type { FinancialInsight } from "./FinancialInsight";
import type { FinancialInsightGeneratorType } from "./FinancialInsightGeneratorType";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";
import type { InsightMetricCategory } from "./InsightMetricCategory";
import { FinancialInsightRegistry } from "./FinancialInsightRegistry";
import { InsightType } from "./InsightType";
import { InsightSeverityLevel } from "./InsightSeverityLevel";
import { FINANCIAL_INSIGHT_SNAPSHOT_VERSION } from "./FinancialInsightSnapshot";

// ─── Sort keys ────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<InsightSeverityLevel, number> = {
  [InsightSeverityLevel.CRITICAL]: 0,
  [InsightSeverityLevel.HIGH]:     1,
  [InsightSeverityLevel.MEDIUM]:   2,
  [InsightSeverityLevel.LOW]:      3,
};

const TYPE_ORDER: Record<InsightType, number> = {
  [InsightType.RISK]:        0,
  [InsightType.WARNING]:     1,
  [InsightType.OPPORTUNITY]: 2,
  [InsightType.MILESTONE]:   3,
  [InsightType.POSITIVE]:    4,
  [InsightType.NEUTRAL]:     5,
};

function insightSortKey(i: FinancialInsight): number {
  return SEVERITY_ORDER[i.severity] * 10 + TYPE_ORDER[i.type];
}

// ─── Summary helpers ──────────────────────────────────────────────────────────

function buildHealthNarrative(insights: ReadonlyArray<FinancialInsight>): string {
  const critical = insights.filter(i => i.severity === InsightSeverityLevel.CRITICAL);
  const high     = insights.filter(i => i.severity === InsightSeverityLevel.HIGH);
  const positive = insights.filter(i => i.type === InsightType.POSITIVE);
  const milestones = insights.filter(i => i.type === InsightType.MILESTONE);

  if (milestones.length > 0 && critical.length === 0 && high.length === 0) {
    return `You have reached a financial milestone. ${positive.length > 0 ? `${positive.length} other positive indicator${positive.length > 1 ? "s" : ""} are also present.` : ""}`.trim();
  }
  if (critical.length > 0) {
    const n = critical.length;
    return `${n} critical financial indicator${n > 1 ? "s" : ""} require${n === 1 ? "s" : ""} attention.`;
  }
  if (high.length > 0) {
    const n = high.length;
    return `${n} financial area${n > 1 ? "s" : ""} ${n > 1 ? "are" : "is"} showing concerning signs.`;
  }
  if (insights.length > 0 && positive.length > insights.length / 2) {
    const n = positive.length;
    return `Your finances are in good shape, with ${n} positive trend${n > 1 ? "s" : ""} detected.`;
  }
  if (insights.length === 0) return "No financial metrics were available for analysis.";
  return "Your finances are broadly stable. Continue monitoring key metrics.";
}

function uniqueCategories(insights: ReadonlyArray<FinancialInsight>): ReadonlyArray<InsightMetricCategory> {
  return [...new Set(insights.map(i => i.category))];
}

function highestSeverity(insights: ReadonlyArray<FinancialInsight>): InsightSeverityLevel | null {
  if (insights.length === 0) return null;
  return insights.reduce<InsightSeverityLevel>((best, i) =>
    SEVERITY_ORDER[i.severity] < SEVERITY_ORDER[best] ? i.severity : best,
    InsightSeverityLevel.LOW,
  );
}

function averageConfidence(insights: ReadonlyArray<FinancialInsight>): number {
  if (insights.length === 0) return 0;
  return insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Orchestrates IInsightGenerator plugins and assembles a FinancialInsightSnapshot.
 *
 * Distinct from the legacy InsightEngine (takes AnalyticsSnapshot).
 */
export class FinancialInsightEngine implements IFinancialInsightEngine {
  constructor(private readonly registry: FinancialInsightRegistry) {}

  generate(
    snapshot: FinancialMetricsSnapshot,
    report: TrendReport,
  ): FinancialInsightSnapshot {
    const allInsights: FinancialInsight[] = [];
    const failures: FinancialInsightGenerationFailure[] = [];

    for (const generator of this.registry.getAll()) {
      try {
        const produced = generator.generate(snapshot, report);
        allInsights.push(...produced);
      } catch (err) {
        failures.push({
          generatorId: generator.definition().id,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    const sorted = [...allInsights].sort((a, b) => insightSortKey(a) - insightSortKey(b));

    const summary = {
      totalInsights: sorted.length,
      positiveInsights: sorted.filter(i => i.type === InsightType.POSITIVE).length,
      warnings:         sorted.filter(i => i.type === InsightType.WARNING).length,
      risks:            sorted.filter(i => i.type === InsightType.RISK).length,
      criticalIssues:   sorted.filter(i => i.severity === InsightSeverityLevel.CRITICAL).length,
      opportunities:    sorted.filter(i => i.type === InsightType.OPPORTUNITY).length,
      milestones:       sorted.filter(i => i.type === InsightType.MILESTONE).length,
      overallFinancialHealthNarrative: buildHealthNarrative(sorted),
    };

    const statistics = {
      metricsAnalyzed:     snapshot.results.length,
      metricsWithTrends:   report.trends.length,
      averageConfidence:   averageConfidence(sorted),
      highestSeverityFound: highestSeverity(sorted),
      categoriesCovered:   uniqueCategories(sorted),
    };

    const now = new Date();
    return Object.freeze({
      userId:          snapshot.userId,
      generatedAt:     now,
      snapshotVersion: FINANCIAL_INSIGHT_SNAPSHOT_VERSION,
      insights:        sorted,
      summary,
      statistics,
      metadata: {
        userId:             snapshot.userId,
        generatedAt:        now,
        generatorsRun:      this.registry.size(),
        generatorFailures:  failures.length,
        metricsConsumed:    snapshot.results.length,
        trendsConsumed:     report.trends.length,
      },
      failures,
    });
  }

  registeredGenerators(): ReadonlyArray<FinancialInsightGeneratorType> {
    return this.registry.registeredIds();
  }
}
