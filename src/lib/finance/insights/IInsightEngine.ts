// @depends-on: IAnalyticsService, AnalyticsSnapshot

import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { InsightSnapshot } from "./InsightSnapshot";
import type { InsightGeneratorType } from "./InsightGeneratorType";

/**
 * Contract for the Insight Engine.
 *
 * InsightEngine consumes one AnalyticsSnapshot and produces one InsightSnapshot.
 * It knows nothing about individual generators — it delegates entirely to
 * the InsightRegistry.
 *
 * Instantiate via createDefaultInsightEngine() from generators/index.ts.
 */
export interface IInsightEngine {
  generate(analyticsSnapshot: AnalyticsSnapshot): InsightSnapshot;
  registeredGenerators(): ReadonlyArray<InsightGeneratorType>;
}
