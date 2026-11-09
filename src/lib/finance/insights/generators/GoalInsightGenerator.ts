import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { AnalyticsFinding } from "../../analytics/AnalyticsFinding";
import type { InsightGenerator } from "../InsightGenerator";
import type { InsightGeneratorDefinition } from "../InsightGeneratorDefinition";
import type { Insight } from "../Insight";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { TrendDirection } from "../../analytics/TrendDirection";
import { InsightCategory } from "../InsightCategory";
import { InsightSeverity } from "../InsightSeverity";
import { toInsightConfidence } from "../InsightConfidence";
import { InsightGeneratorType } from "../InsightGeneratorType";

/**
 * GoalInsightGenerator — interprets GOAL_PROGRESS findings from GoalProgressAnalyzer.
 *
 * The GoalProgressAnalyzer produces:
 *   NET_WORTH_GROWTH    — net worth growing consistently
 *   NET_WORTH_DECLINE   — net worth declining
 *   NET_WORTH_STABLE    — net worth effectively flat
 *   SAVINGS_VELOCITY_LOW — savings rate positive in less than half of periods
 *
 * Each is translated into a goal-oriented insight.
 */
export class GoalInsightGenerator implements InsightGenerator {
  private static readonly DEFINITION: InsightGeneratorDefinition = {
    id:          InsightGeneratorType.GOAL,
    name:        "Goal Insight Generator",
    description: "Interprets goal progress and wealth trajectory findings as insights.",
    version:     "1.0",
  };

  definition(): InsightGeneratorDefinition {
    return GoalInsightGenerator.DEFINITION;
  }

  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight> {
    return snapshot.findings
      .filter((f) => f.type === AnalysisFindingType.GOAL_PROGRESS)
      .map((f) => this._toInsight(f));
  }

  private _toInsight(finding: AnalyticsFinding): Insight {
    const confidence = toInsightConfidence(finding.confidence);

    if (finding.id === "SAVINGS_VELOCITY_LOW") {
      return {
        id:          `${finding.id}_INSIGHT`,
        category:    InsightCategory.GOALS,
        severity:    InsightSeverity.WARNING,
        confidence,
        title:       "Savings consistency is low",
        description:
          "A positive savings rate was recorded in fewer than half of the tracked periods. " +
          "Inconsistent savings makes it harder to build toward financial goals.",
        supportingFindingIds: [finding.id],
        generatedAt: new Date(),
      };
    }

    const improving = finding.direction === TrendDirection.IMPROVING;
    const stable    = finding.direction === TrendDirection.STABLE;

    const severity: InsightSeverity = improving
      ? InsightSeverity.INFO
      : stable
        ? InsightSeverity.INFO
        : InsightSeverity.WARNING;

    const pct = Math.abs((finding.magnitude ?? 0) * 100).toFixed(1);

    const title = improving
      ? "Net worth is growing"
      : stable
        ? "Net worth is holding steady"
        : "Net worth is declining";

    const description = improving
      ? `Net worth increased by ${pct}% over the period, indicating positive wealth accumulation.`
      : stable
        ? "Net worth has remained essentially unchanged over the period."
        : `Net worth declined by ${pct}% over the period. ${finding.description}`;

    return {
      id:          `${finding.id}_INSIGHT`,
      category:    InsightCategory.GOALS,
      severity,
      confidence,
      title,
      description,
      supportingFindingIds: [finding.id],
      generatedAt: new Date(),
    };
  }
}
