import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { AnalyticsFinding } from "../../analytics/AnalyticsFinding";
import type { InsightGenerator } from "../InsightGenerator";
import type { InsightGeneratorDefinition } from "../InsightGeneratorDefinition";
import type { Insight } from "../Insight";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { InsightCategory } from "../InsightCategory";
import { InsightSeverity } from "../InsightSeverity";
import { toInsightConfidence } from "../InsightConfidence";
import { InsightGeneratorType } from "../InsightGeneratorType";

/**
 * SpendingInsightGenerator — interprets SEASONALITY and VARIANCE findings.
 *
 * The SeasonalityAnalyzer detects quarterly spending rhythms in BURN_RATE and
 * RECURRING_SPEND. The VarianceAnalyzer flags metrics with high coefficient of
 * variation as volatile.
 *
 * Both are spending-pattern observations useful for understanding where money
 * goes and when.
 */
export class SpendingInsightGenerator implements InsightGenerator {
  private static readonly DEFINITION: InsightGeneratorDefinition = {
    id:          InsightGeneratorType.SPENDING,
    name:        "Spending Insight Generator",
    description: "Interprets seasonal spending patterns and spending volatility as insights.",
    version:     "1.0",
  };

  definition(): InsightGeneratorDefinition {
    return SpendingInsightGenerator.DEFINITION;
  }

  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight> {
    const insights: Insight[] = [];

    for (const finding of snapshot.findings) {
      if (finding.type === AnalysisFindingType.SEASONALITY) {
        insights.push(this._seasonalityInsight(finding));
      }

      if (finding.type === AnalysisFindingType.VARIANCE) {
        insights.push(this._varianceInsight(finding));
      }
    }

    return insights;
  }

  private _seasonalityInsight(finding: AnalyticsFinding): Insight {
    const confidence = toInsightConfidence(finding.confidence);

    return {
      id:          `${finding.id}_INSIGHT`,
      category:    InsightCategory.SPENDING,
      severity:    InsightSeverity.INFO,
      confidence,
      title:       finding.title,
      description:
        `${finding.description} ` +
        "Seasonal patterns can be anticipated and planned for in advance.",
      supportingFindingIds: [finding.id],
      generatedAt: new Date(),
    };
  }

  private _varianceInsight(finding: AnalyticsFinding): Insight {
    const confidence = toInsightConfidence(finding.confidence);
    const metricName = finding.title.replace(/ Variance$/, "").replace(/ is volatile$/, "");

    return {
      id:          `${finding.id}_INSIGHT`,
      category:    InsightCategory.SPENDING,
      severity:    InsightSeverity.WARNING,
      confidence,
      title:       `${metricName} is inconsistent`,
      description:
        `${finding.description} ` +
        "High variability makes it difficult to forecast future cash position.",
      supportingFindingIds: [finding.id],
      generatedAt: new Date(),
    };
  }
}
