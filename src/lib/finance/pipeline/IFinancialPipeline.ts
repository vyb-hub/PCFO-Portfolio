import type { PipelineResult } from "./PipelineResult";

/**
 * Public contract for the Financial Intelligence Pipeline.
 *
 * The pipeline sequences the full domain processing chain:
 *   Aggregate → Metrics → Trends → Analytics → Insights → Recommendations → Review + Story
 *
 * One entry point. No business logic. No repository access.
 */
export interface IFinancialPipeline {
  /**
   * Run the full pipeline for the current month.
   * Builds FinancialAggregate for the current calendar month,
   * then processes each layer in order.
   */
  run(userId: string): Promise<PipelineResult>;
}
