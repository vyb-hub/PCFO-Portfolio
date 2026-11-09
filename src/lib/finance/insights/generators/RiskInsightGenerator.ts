import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { AnalyticsFinding } from "../../analytics/AnalyticsFinding";
import type { InsightGenerator } from "../InsightGenerator";
import type { InsightGeneratorDefinition } from "../InsightGeneratorDefinition";
import type { Insight } from "../Insight";
import { AnalysisFindingType } from "../../analytics/AnalysisFindingType";
import { InsightCategory } from "../InsightCategory";
import { InsightSeverity } from "../InsightSeverity";
import { InsightConfidence, toInsightConfidence } from "../InsightConfidence";
import { InsightGeneratorType } from "../InsightGeneratorType";

/**
 * RiskInsightGenerator — interprets RISK findings from RiskAnalyzer.
 *
 * The RiskAnalyzer identifies:
 *   - Metrics approaching their maximum threshold (within 15%)
 *   - Metrics already breaching their maximum threshold
 *   - Metrics below their minimum threshold
 *
 * Severity escalation:
 *   Threshold already breached + HIGH confidence → CRITICAL
 *   Approaching threshold                         → WARNING
 */
export class RiskInsightGenerator implements InsightGenerator {
  private static readonly DEFINITION: InsightGeneratorDefinition = {
    id:          InsightGeneratorType.RISK,
    name:        "Risk Insight Generator",
    description: "Interprets threshold proximity and breach findings as financial risk insights.",
    version:     "1.0",
  };

  definition(): InsightGeneratorDefinition {
    return RiskInsightGenerator.DEFINITION;
  }

  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight> {
    return snapshot.findings
      .filter((f) => f.type === AnalysisFindingType.RISK)
      .map((f) => this._toInsight(f));
  }

  private _toInsight(finding: AnalyticsFinding): Insight {
    const confidence = toInsightConfidence(finding.confidence);

    // magnitude > 0 means the threshold has been breached (value/max - 1 > 0)
    const breached = (finding.magnitude ?? 0) > 0;
    const severity: InsightSeverity =
      breached && confidence === InsightConfidence.HIGH
        ? InsightSeverity.CRITICAL
        : InsightSeverity.WARNING;

    return {
      id:          `${finding.id}_INSIGHT`,
      category:    InsightCategory.RISK,
      severity,
      confidence,
      title:       breached
        ? `${finding.title} — threshold exceeded`
        : `${finding.title} — threshold approaching`,
      description: finding.description,
      supportingFindingIds: [finding.id],
      generatedAt: new Date(),
    };
  }
}
