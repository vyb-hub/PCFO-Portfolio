import type { FinancialInsight } from "./FinancialInsight";
import type { FinancialInsightGeneratorDefinition } from "./FinancialInsightGeneratorDefinition";
import type { FinancialMetricsSnapshot } from "../metrics/snapshot/FinancialMetricsSnapshot";
import type { TrendReport } from "../trends/TrendReport";

/**
 * Plugin interface for the Insight Generation Engine.
 *
 * Each generator is responsible for a single financial domain (Savings, Debt, etc.)
 * and produces zero or more FinancialInsight objects from metric + trend data.
 *
 * Distinct from the legacy InsightGenerator interface (no I-prefix, takes AnalyticsSnapshot)
 * used by the analytics-pipeline system.
 *
 * Contract:
 * - MUST be pure: same inputs → same outputs.
 * - MUST NOT throw; return an empty array instead of throwing.
 * - MUST NOT describe actions (recommendations belong to EC-008).
 * - MUST return [] when the relevant metrics are absent from the snapshot.
 */
export interface IInsightGenerator {
  definition(): FinancialInsightGeneratorDefinition;
  generate(
    snapshot: FinancialMetricsSnapshot,
    report: TrendReport,
  ): ReadonlyArray<FinancialInsight>;
}
