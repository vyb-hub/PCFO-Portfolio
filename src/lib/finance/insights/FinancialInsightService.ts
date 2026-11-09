import type { IFinancialInsightService } from "./IFinancialInsightService";
import type { IFinancialInsightEngine } from "./IFinancialInsightEngine";
import type { FinancialInsightSnapshot } from "./FinancialInsightSnapshot";
import type { FinancialInsight } from "./FinancialInsight";
import type { FinancialInsightSummary } from "./FinancialInsightSummary";
import type { InsightType } from "./InsightType";
import type { InsightSeverityLevel } from "./InsightSeverityLevel";
import type { InsightMetricCategory } from "./InsightMetricCategory";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";
import { InsightSeverityLevel as SL } from "./InsightSeverityLevel";
import { InsightType as IT } from "./InsightType";

/**
 * Façade over IFinancialInsightEngine.
 * Provides generation + querying helpers for insight consumers.
 */
export class FinancialInsightService implements IFinancialInsightService {
  constructor(private readonly engine: IFinancialInsightEngine) {}

  generate(
    snapshot: FinancialMetricsSnapshot,
    report: TrendReport,
  ): FinancialInsightSnapshot {
    return this.engine.generate(snapshot, report);
  }

  summarise(snapshot: FinancialInsightSnapshot): FinancialInsightSummary {
    return snapshot.summary;
  }

  getByType(
    snapshot: FinancialInsightSnapshot,
    type: InsightType,
  ): ReadonlyArray<FinancialInsight> {
    return snapshot.insights.filter(i => i.type === type);
  }

  getBySeverity(
    snapshot: FinancialInsightSnapshot,
    severity: InsightSeverityLevel,
  ): ReadonlyArray<FinancialInsight> {
    return snapshot.insights.filter(i => i.severity === severity);
  }

  getByCategory(
    snapshot: FinancialInsightSnapshot,
    category: InsightMetricCategory,
  ): ReadonlyArray<FinancialInsight> {
    return snapshot.insights.filter(i => i.category === category);
  }

  /** All CRITICAL or HIGH severity insights. */
  getUrgent(snapshot: FinancialInsightSnapshot): ReadonlyArray<FinancialInsight> {
    return snapshot.insights.filter(
      i => i.severity === SL.CRITICAL || i.severity === SL.HIGH,
    );
  }

  /** All POSITIVE and MILESTONE insights. */
  getHighlights(snapshot: FinancialInsightSnapshot): ReadonlyArray<FinancialInsight> {
    return snapshot.insights.filter(
      i => i.type === IT.POSITIVE || i.type === IT.MILESTONE,
    );
  }
}
