import type { IFinancialPipeline } from "./IFinancialPipeline";
import type { PipelineResult } from "./PipelineResult";
import type { FinancialReview } from "../reviews/FinancialReview";
import type { ConversationEngineInput } from "../conversation/ConversationEngineInput";
import type { IFinancialStateService } from "./IFinancialStateService";

/**
 * Concrete implementation of IFinancialStateService.
 *
 * Wraps IFinancialPipeline — every method here still runs the full pipeline
 * (no caching), just narrows the result for the caller. Keeping this thin by
 * design: it has no business logic of its own, only field selection.
 */
export class FinancialStateService implements IFinancialStateService {
  constructor(private readonly pipeline: IFinancialPipeline) {}

  async getPipelineResult(userId: string): Promise<PipelineResult> {
    return this.pipeline.run(userId);
  }

  async getLatestReview(userId: string): Promise<FinancialReview> {
    const result = await this.pipeline.run(userId);
    return result.review;
  }

  async getConversationInput(userId: string): Promise<ConversationEngineInput> {
    const result = await this.pipeline.run(userId);
    return {
      userId,
      storySnapshot: result.storySnapshot,
      review: result.review,
      insightSnapshot: result.insightSnapshot,
      recommendationSnapshot: result.recommendationSnapshot,
    };
  }
}
