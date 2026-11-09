import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { InsightGenerator } from "../InsightGenerator";
import type { InsightGeneratorDefinition } from "../InsightGeneratorDefinition";
import type { Insight } from "../Insight";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { InsightCategory } from "../InsightCategory";
import { InsightSeverity } from "../InsightSeverity";
import { toInsightConfidence } from "../InsightConfidence";
import { InsightGeneratorType } from "../InsightGeneratorType";

/**
 * BehaviourInsightGenerator — interprets BEHAVIOUR findings from BehaviourAnalyzer.
 *
 * The BehaviourAnalyzer detects two patterns:
 *   RECURRING_SPEND_CREEP — recurring costs growing faster than overall spending
 *   SAVINGS_COMPRESSION   — savings rate declining while burn rate rises simultaneously
 *
 * Both patterns are financially meaningful and warrant a direct insight.
 */
export class BehaviourInsightGenerator implements InsightGenerator {
  private static readonly DEFINITION: InsightGeneratorDefinition = {
    id:          InsightGeneratorType.BEHAVIOUR,
    name:        "Behaviour Insight Generator",
    description: "Interprets spending and saving behavioural patterns as insights.",
    version:     "1.0",
  };

  definition(): InsightGeneratorDefinition {
    return BehaviourInsightGenerator.DEFINITION;
  }

  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight> {
    const insights: Insight[] = [];

    for (const finding of snapshot.findings) {
      if (finding.type !== AnalysisFindingType.BEHAVIOUR) continue;

      const confidence = toInsightConfidence(finding.confidence);

      if (finding.id === "RECURRING_SPEND_CREEP") {
        insights.push({
          id:          `${finding.id}_INSIGHT`,
          category:    InsightCategory.SPENDING,
          severity:    InsightSeverity.WARNING,
          confidence,
          title:       "Recurring costs are growing",
          description:
            "Recurring expenses are increasing as a proportion of total spending. " +
            "Fixed financial commitments are claiming a larger share of outgoings over time.",
          supportingFindingIds: [finding.id],
          generatedAt: new Date(),
        });
      }

      if (finding.id === "SAVINGS_COMPRESSION") {
        insights.push({
          id:          `${finding.id}_INSIGHT`,
          category:    InsightCategory.SAVINGS,
          severity:    InsightSeverity.CRITICAL,
          confidence,
          title:       "Savings being compressed",
          description:
            "Savings rate is declining at the same time as the monthly burn rate is rising. " +
            "Spending growth is outpacing income growth, squeezing the amount available to save.",
          supportingFindingIds: [finding.id],
          generatedAt: new Date(),
        });
      }
    }

    return insights;
  }
}
