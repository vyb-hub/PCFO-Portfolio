import type { IFinancialAggregator } from "../aggregation/IFinancialAggregator";
import type { IFinancialMetricsSnapshotService } from "../metrics/snapshot/IFinancialMetricsSnapshotService";
import type { ITrendService } from "../trends/ITrendService";
import type { IAnalyticsEngine } from "../analytics/IAnalyticsEngine";
import type { IFinancialInsightService } from "../insights/IFinancialInsightService";
import type { IRecommendationEngine } from "../recommendations/IRecommendationEngine";
import type { IFinancialReviewService } from "../reviews/IFinancialReviewService";
import type { IStoryEngine } from "../story/IStoryEngine";
import type { IFinancialPipeline } from "./IFinancialPipeline";
import type { PipelineResult } from "./PipelineResult";

/**
 * Concrete implementation of IFinancialPipeline.
 *
 * Sequences the Financial Intelligence Platform layers in dependency order:
 *   1. Aggregate      — raw financial data for the current month
 *   2. Metrics        — computed health scores and KPIs
 *   3. Trends         — directional signals over historical snapshots
 *   4. Analytics      — pattern findings across snapshots
 *   5. Insights       — human-readable observations with evidence
 *   6. Recommendations — prioritised actionable suggestions
 *   7. Review         — assembled monthly summary
 *   8. Story          — evidence-backed narrative (sibling of Review, not
 *                       dependent on it — see EC-011 / ADR-019)
 *
 * First-run behaviour (documented in CALIBRATION_NOTES.md):
 *   - Trends and Analytics receive [currentSnapshot] as the only history.
 *   - TrendService returns INSUFFICIENT_DATA direction (graceful degradation).
 *   - Analytics analyzers requiring ≥2 snapshots are skipped (not failed).
 *   - analyticsAnalyzersSkipped in metadata reflects this.
 */
export class FinancialPipeline implements IFinancialPipeline {
  constructor(
    private readonly aggregator: IFinancialAggregator,
    private readonly metricsService: IFinancialMetricsSnapshotService,
    private readonly trendService: ITrendService,
    private readonly analyticsEngine: IAnalyticsEngine,
    private readonly insightService: IFinancialInsightService,
    private readonly recommendationEngine: IRecommendationEngine,
    private readonly reviewService: IFinancialReviewService,
    private readonly storyEngine: IStoryEngine,
  ) {}

  async run(userId: string): Promise<PipelineResult> {
    const startTime = Date.now();

    // Step 1: Aggregate — fetch and organize all raw financial data
    const aggregate = await this.aggregator.getCurrentFinancialState(userId);

    // Step 2: Metrics — compute all KPIs synchronously
    const metricsSnapshot = this.metricsService.build(aggregate);

    // Step 3: Trends — analyze directional signals
    // On first run, history = [currentSnapshot]. TrendService handles this gracefully.
    const trendReport = this.trendService.analyze([metricsSnapshot]);

    // Step 4: Analytics — find patterns across snapshot history
    // AnalyticsEngine.analyze() requires ≥1 snapshot; analyzers requiring more are skipped.
    const analyticsSnapshot = this.analyticsEngine.analyze([metricsSnapshot]);

    // Step 5: Insights — generate human-readable observations
    const insightSnapshot = this.insightService.generate(metricsSnapshot, trendReport);

    // Step 6: Recommendations — generate prioritised action suggestions
    const recommendationSnapshot = this.recommendationEngine.generate(
      metricsSnapshot,
      analyticsSnapshot,
      insightSnapshot,
    );

    // Step 7: Review — assemble the final monthly summary
    const review = this.reviewService.build(
      metricsSnapshot,
      insightSnapshot,
      recommendationSnapshot,
    );

    // Step 8: Story — generate evidence-backed narrative (independent of Review)
    const storySnapshot = this.storyEngine.generate({
      aggregate,
      metricsSnapshot,
      analyticsSnapshot,
      insightSnapshot,
      recommendationSnapshot,
    });

    const durationMs = Date.now() - startTime;

    return Object.freeze({
      metadata: Object.freeze({
        userId,
        ranAt: new Date(),
        durationMs,
        historicalSnapshotCount: 1,
        analyticsAnalyzersSkipped: analyticsSnapshot.metadata.analyzersSkipped,
      }),
      aggregate,
      metricsSnapshot,
      trendReport,
      analyticsSnapshot,
      insightSnapshot,
      recommendationSnapshot,
      review,
      storySnapshot,
    });
  }
}
