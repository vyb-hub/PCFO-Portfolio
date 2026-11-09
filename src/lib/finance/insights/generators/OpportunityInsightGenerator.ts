import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { InsightGenerator } from "../InsightGenerator";
import type { InsightGeneratorDefinition } from "../InsightGeneratorDefinition";
import type { Insight } from "../Insight";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { TrendDirection } from "../../analytics/TrendDirection";
import { MetricType } from "../../metrics/MetricType";
import { InsightCategory } from "../InsightCategory";
import { InsightSeverity } from "../InsightSeverity";
import { InsightConfidence } from "../InsightConfidence";
import { InsightGeneratorType } from "../InsightGeneratorType";

/**
 * OpportunityInsightGenerator — detects positive convergence across multiple
 * TREND and STABILITY findings.
 *
 * An opportunity exists when two or more improving trend signals align:
 *   - Savings rate improving + DTI declining   → SAVINGS + DEBT dual improvement
 *   - Savings rate improving + net worth growing → wealth accumulation momentum
 *   - Two or more stable, healthy metrics        → financial stability signal
 *
 * These are cross-finding insights that no single analyzer can surface.
 */
export class OpportunityInsightGenerator implements InsightGenerator {
  private static readonly DEFINITION: InsightGeneratorDefinition = {
    id:          InsightGeneratorType.OPPORTUNITY,
    name:        "Opportunity Insight Generator",
    description: "Detects positive multi-metric convergence and stability signals.",
    version:     "1.0",
  };

  definition(): InsightGeneratorDefinition {
    return OpportunityInsightGenerator.DEFINITION;
  }

  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight> {
    const insights: Insight[] = [];

    const trendFindings = snapshot.findings.filter(
      (f) => f.type === AnalysisFindingType.TREND,
    );
    const stabilityFindings = snapshot.findings.filter(
      (f) => f.type === AnalysisFindingType.STABILITY,
    );

    // Pattern 1: Savings rate improving + DTI improving simultaneously
    const savingsImproving = trendFindings.find(
      (f) =>
        f.metricType === MetricType.SAVINGS_RATE &&
        f.direction === TrendDirection.IMPROVING,
    );
    const dtiImproving = trendFindings.find(
      (f) =>
        f.metricType === MetricType.DEBT_TO_INCOME_RATIO &&
        f.direction === TrendDirection.IMPROVING,
    );

    if (savingsImproving && dtiImproving) {
      const avgConfidence = (savingsImproving.confidence + dtiImproving.confidence) / 2;
      const confidence: InsightConfidence =
        avgConfidence >= 0.75
          ? InsightConfidence.HIGH
          : avgConfidence >= 0.50
            ? InsightConfidence.MEDIUM
            : InsightConfidence.LOW;

      insights.push({
        id:          "OPPORTUNITY_SAVINGS_DEBT_DUAL_IMPROVEMENT_INSIGHT",
        category:    InsightCategory.OPPORTUNITY,
        severity:    InsightSeverity.INFO,
        confidence,
        title:       "Savings and debt improving together",
        description:
          "The savings rate is on an upward trend while the debt-to-income ratio is declining. " +
          "Both metrics moving in the right direction together is a strong indicator of improving financial health.",
        supportingFindingIds: [savingsImproving.id, dtiImproving.id],
        generatedAt: new Date(),
      });
    }

    // Pattern 2: Savings rate improving + net worth growing
    const netWorthImproving = trendFindings.find(
      (f) =>
        f.metricType === MetricType.NET_WORTH &&
        f.direction === TrendDirection.IMPROVING,
    );

    if (savingsImproving && netWorthImproving && !dtiImproving) {
      const avgConfidence = (savingsImproving.confidence + netWorthImproving.confidence) / 2;
      const confidence: InsightConfidence =
        avgConfidence >= 0.75
          ? InsightConfidence.HIGH
          : avgConfidence >= 0.50
            ? InsightConfidence.MEDIUM
            : InsightConfidence.LOW;

      insights.push({
        id:          "OPPORTUNITY_SAVINGS_WEALTH_MOMENTUM_INSIGHT",
        category:    InsightCategory.OPPORTUNITY,
        severity:    InsightSeverity.INFO,
        confidence,
        title:       "Savings and wealth both growing",
        description:
          "Savings rate is rising and net worth is growing — indicating that savings are successfully " +
          "translating into wealth accumulation.",
        supportingFindingIds: [savingsImproving.id, netWorthImproving.id],
        generatedAt: new Date(),
      });
    }

    // Pattern 3: Two or more stability findings → financial stability signal
    if (stabilityFindings.length >= 2) {
      const avgConfidence =
        stabilityFindings.reduce((sum, f) => sum + f.confidence, 0) / stabilityFindings.length;
      const confidence: InsightConfidence =
        avgConfidence >= 0.75
          ? InsightConfidence.HIGH
          : avgConfidence >= 0.50
            ? InsightConfidence.MEDIUM
            : InsightConfidence.LOW;

      insights.push({
        id:          "OPPORTUNITY_MULTI_METRIC_STABILITY_INSIGHT",
        category:    InsightCategory.OPPORTUNITY,
        severity:    InsightSeverity.INFO,
        confidence,
        title:       "Multiple metrics are stable",
        description:
          `${stabilityFindings.length} key metrics are showing consistent, low-variance readings. ` +
          "Financial predictability is a foundation for making longer-term plans.",
        supportingFindingIds: stabilityFindings.map((f) => f.id),
        generatedAt: new Date(),
      });
    }

    return insights;
  }
}
