// @depends-on: IAnalyticsService, AnalyticsSnapshot, IInsightEngine, InsightSnapshot

import type { AnalyticsSnapshot } from "../analytics/AnalyticsSnapshot";
import type { InsightSnapshot } from "./InsightSnapshot";
import type { InsightSummary } from "./InsightSummary";
import type { Insight } from "./Insight";
import type { InsightCategory } from "./InsightCategory";
import type { InsightSeverity } from "./InsightSeverity";

/**
 * Public service contract for the Insight Platform.
 *
 * IInsightService is the boundary that the Recommendation Platform and AI Coach
 * depend on. No downstream consumer should reference InsightGenerator
 * implementations or InsightEngine directly.
 *
 * Dependency flow:
 *   AnalyticsSnapshot → IInsightService → InsightSnapshot
 *                                       → Recommendation Platform
 *                                       → AI Coach
 */
export interface IInsightService {
  /**
   * Generate an InsightSnapshot from the given AnalyticsSnapshot.
   * The snapshot captures all insights, sorted CRITICAL → WARNING → INFO,
   * along with any generator failures.
   */
  generate(analyticsSnapshot: AnalyticsSnapshot): InsightSnapshot;

  /**
   * Derive a lightweight summary from an existing InsightSnapshot.
   * Suitable for dashboard cards, notification counts, and logging.
   */
  summarise(snapshot: InsightSnapshot): InsightSummary;

  /**
   * Return all insights in the given category, preserving their
   * CRITICAL → WARNING → INFO sort order.
   */
  getByCategory(snapshot: InsightSnapshot, category: InsightCategory): ReadonlyArray<Insight>;

  /**
   * Return all insights at the given severity level, preserving their
   * original sort order.
   */
  getBySeverity(snapshot: InsightSnapshot, severity: InsightSeverity): ReadonlyArray<Insight>;
}
