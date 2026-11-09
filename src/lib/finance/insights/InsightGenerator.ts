import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { Insight } from "./Insight";
import type { InsightGeneratorDefinition } from "./InsightGeneratorDefinition";

/**
 * Plugin interface for insight generation.
 *
 * Each InsightGenerator focuses on one analytical domain (trends, risks,
 * behaviours, etc.) and produces zero or more Insights from the findings
 * in an AnalyticsSnapshot.
 *
 * Contract:
 *   - Receive one AnalyticsSnapshot. Never access repositories or metrics.
 *   - Return a ReadonlyArray<Insight>. May be empty.
 *   - Must be pure and synchronous — no I/O, no AI calls.
 *   - Must not throw — return an empty array when no insights apply.
 *
 * Registration:
 *   InsightRegistry.register(new MyInsightGenerator())
 *
 * Wiring:
 *   createDefaultInsightEngine() in generators/index.ts is the sole place
 *   where concrete generators are named. InsightEngine never names them.
 */
export interface InsightGenerator {
  definition(): InsightGeneratorDefinition;
  generate(snapshot: AnalyticsSnapshot): ReadonlyArray<Insight>;
}
