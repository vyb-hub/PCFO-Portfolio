import type { MetricType } from "../metrics/MetricType";
import type { MetricTrendResult } from "../trends/MetricTrendResult";
import type { InsightType } from "./InsightType";
import type { InsightSeverityLevel } from "./InsightSeverityLevel";
import type { InsightMetricCategory } from "./InsightMetricCategory";

/**
 * A single descriptive observation about a financial metric.
 *
 * FinancialInsight is the core domain type of the Insight Generation Engine.
 * It explains WHAT is happening and WHY — never what the user should do.
 *
 * Distinct from the legacy Insight interface used by the analytics-pipeline system.
 */
export interface FinancialInsight {
  readonly id: string;
  readonly metric: MetricType;
  readonly category: InsightMetricCategory;
  readonly type: InsightType;
  readonly severity: InsightSeverityLevel;
  /** One-line headline suitable for a notification or card header. */
  readonly title: string;
  /** 1–2 sentence explanation of what changed. */
  readonly summary: string;
  /** Full description including trend context and significance. */
  readonly details: string;
  /** 0.0 → 1.0 derived from trend R², consistency, and data quantity. */
  readonly confidence: number;
  /** Additional metrics that informed this insight. */
  readonly supportingMetrics: ReadonlyArray<MetricType>;
  /** Trend results that informed this insight. */
  readonly supportingTrends: ReadonlyArray<MetricTrendResult>;
  readonly createdAt: Date;
}
