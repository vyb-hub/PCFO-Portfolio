import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsFinding } from "./AnalyticsFinding";
import type { AnalysisExecutionFailure, AnalyticsSnapshot } from "./AnalyticsSnapshot";
import type { AnalyticsMetadata } from "./AnalyticsMetadata";
import type { IAnalyticsEngine } from "./IAnalyticsEngine";
import type { AnalysisFindingType } from "./AnalysisFindingType";
import type { AnalyzerType } from "./AnalyzerType";
import { AnalyticsRegistry } from "./AnalyticsRegistry";

/**
 * Concrete implementation of IAnalyticsEngine.
 *
 * AnalyticsEngine knows nothing about individual analyzers — it delegates
 * entirely to AnalyticsRegistry. Adding a new analyzer never requires
 * touching this class.
 *
 * Instantiate via createDefaultAnalyticsEngine() from analyzers/index.ts,
 * or build a custom engine with a subset of analyzers for testing.
 */
export class AnalyticsEngine implements IAnalyticsEngine {
  constructor(private readonly registry: AnalyticsRegistry) {}

  analyze(snapshots: ReadonlyArray<FinancialMetricsSnapshot>): AnalyticsSnapshot {
    if (snapshots.length === 0) {
      throw new Error("AnalyticsEngine.analyze: at least one snapshot is required");
    }

    const sorted = [...snapshots].sort(
      (a, b) => a.period.range.end.getTime() - b.period.range.end.getTime(),
    );

    const first = sorted[0]!;
    const last  = sorted[sorted.length - 1]!;

    const userId = last.userId;

    const analysisWindow = {
      start: first.period.range.start,
      end: last.period.range.end,
    };

    const allFindings: AnalyticsFinding[] = [];
    const failures: AnalysisExecutionFailure[] = [];
    let analyzersRun = 0;
    let analyzersSkipped = 0;

    for (const analyzer of this.registry.getAll()) {
      const minRequired = analyzer.definition().minimumSnapshots;
      if (sorted.length < minRequired) {
        analyzersSkipped++;
        continue;
      }

      analyzersRun++;
      try {
        const findings = analyzer.analyze(sorted);
        allFindings.push(...findings);
      } catch (err) {
        failures.push({
          analyzerName: analyzer.definition().name,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    const metadata: AnalyticsMetadata = {
      userId,
      analyzedAt: new Date(),
      snapshotsAnalyzed: sorted.length,
      analyzersRun,
      analyzersSkipped,
      analyzerFailures: failures.length,
      totalFindings: allFindings.length,
    };

    return Object.freeze({
      userId,
      analysisWindow,
      metadata,
      findings:  Object.freeze([...allFindings]),
      failures:  Object.freeze([...failures]),
    });
  }

  getFindingsByType(
    snapshot: AnalyticsSnapshot,
    type: AnalysisFindingType,
  ): ReadonlyArray<AnalyticsFinding> {
    return snapshot.findings.filter((f) => f.type === type);
  }

  isSupported(type: AnalyzerType): boolean {
    return this.registry.has(type);
  }

  registeredTypes(): ReadonlyArray<AnalyzerType> {
    return this.registry.getAll().map((a) => a.definition().id);
  }
}
