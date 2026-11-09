import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { IInsightEngine } from "./IInsightEngine";
import type { InsightGenerationFailure, InsightSnapshot } from "./InsightSnapshot";
import type { InsightMetadata } from "./InsightMetadata";
import type { Insight } from "./Insight";
import type { InsightGeneratorType } from "./InsightGeneratorType";
import { InsightSeverity } from "./InsightSeverity";
import { InsightRegistry } from "./InsightRegistry";

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  [InsightSeverity.CRITICAL]: 0,
  [InsightSeverity.WARNING]:  1,
  [InsightSeverity.INFO]:     2,
};

/**
 * Concrete implementation of IInsightEngine.
 *
 * InsightEngine knows nothing about individual generators — it delegates
 * entirely to InsightRegistry. Adding a new generator never requires
 * touching this class.
 *
 * Instantiate via createDefaultInsightEngine() from generators/index.ts,
 * or build a custom engine with a subset of generators for testing.
 */
export class InsightEngine implements IInsightEngine {
  constructor(private readonly registry: InsightRegistry) {}

  generate(analyticsSnapshot: AnalyticsSnapshot): InsightSnapshot {
    const allInsights: Insight[] = [];
    const failures: InsightGenerationFailure[] = [];
    let generatorsRun = 0;

    for (const generator of this.registry.getAll()) {
      generatorsRun++;
      try {
        const produced = generator.generate(analyticsSnapshot);
        allInsights.push(...produced);
      } catch (err) {
        failures.push({
          generatorName: generator.definition().name,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    const sorted = [...allInsights].sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
    );

    const criticalInsights = sorted.filter((i) => i.severity === InsightSeverity.CRITICAL).length;
    const warningInsights  = sorted.filter((i) => i.severity === InsightSeverity.WARNING).length;
    const infoInsights     = sorted.filter((i) => i.severity === InsightSeverity.INFO).length;

    const metadata: InsightMetadata = {
      userId:            analyticsSnapshot.userId,
      generatedAt:       new Date(),
      findingsConsumed:  analyticsSnapshot.findings.length,
      generatorsRun,
      generatorFailures: failures.length,
      totalInsights:     sorted.length,
      criticalInsights,
      warningInsights,
      infoInsights,
    };

    return Object.freeze({
      userId:         analyticsSnapshot.userId,
      analysisWindow: analyticsSnapshot.analysisWindow,
      metadata,
      insights:  Object.freeze(sorted),
      failures:  Object.freeze(failures),
    });
  }

  registeredGenerators(): ReadonlyArray<InsightGeneratorType> {
    return this.registry.getDefinitions().map((d) => d.id);
  }
}
