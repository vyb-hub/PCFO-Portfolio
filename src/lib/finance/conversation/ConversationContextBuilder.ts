import type { ConversationIntent } from "./ConversationIntent";
import type { ConversationEngineInput } from "./ConversationEngineInput";
import type { ConversationContext } from "./ConversationContext";
import type { StoryEvidence } from "../story/StoryEvidence";
import type { MetricType } from "../metrics/MetricType";
import { ConversationIntentType } from "./ConversationIntentType";
import { EMPTY_STORY_EVIDENCE } from "../story/StoryEvidence";
import { StoryBlockType } from "../story/StoryBlockType";
import { InsightType } from "../insights/InsightType";

function evidence(overrides: Partial<StoryEvidence>): StoryEvidence {
  return Object.freeze({ ...EMPTY_STORY_EVIDENCE, ...overrides });
}

/**
 * Selects the authoritative deterministic source for a resolved
 * ConversationIntent and assembles a ConversationContext.
 *
 * Story where it exists (only CASH_FLOW/LARGEST_EXPENSE has a generator as
 * of EC-012); FinancialReview/RecommendationSnapshot/FinancialInsightSnapshot
 * elsewhere. Never calculates — only selects and resolves ids against
 * already-computed snapshots. See ADR-020 for the per-intent mapping and
 * why this is a selector (switch) rather than a registry, unlike story/.
 */
export class ConversationContextBuilder {
  build(intent: ConversationIntent, input: ConversationEngineInput): ConversationContext {
    switch (intent.type) {
      case ConversationIntentType.DAILY_BRIEF:
      case ConversationIntentType.WEEKLY_REVIEW:
      case ConversationIntentType.MONTHLY_REVIEW:
      case ConversationIntentType.FINANCIAL_HEALTH:
        return this.buildReviewContext(intent, input);

      case ConversationIntentType.LARGEST_EXPENSE:
        return this.buildLargestExpenseContext(intent, input);

      case ConversationIntentType.TOP_RISK:
        return this.buildRiskOrGoalContext(intent, input, "RISK");

      case ConversationIntentType.GOAL_PROGRESS:
        return this.buildRiskOrGoalContext(intent, input, "GOAL");

      case ConversationIntentType.EXPLAIN_STORY:
        return this.buildExplainStoryContext(intent, input);

      case ConversationIntentType.EXPLAIN_RECOMMENDATION:
        return this.buildExplainRecommendationContext(intent, input);

      case ConversationIntentType.WHATS_CHANGED:
        return this.buildChangesContext(intent, input);

      case ConversationIntentType.UNKNOWN:
      default:
        return { kind: "HELP", intentType: intent.type };
    }
  }

  private buildReviewContext(intent: ConversationIntent, input: ConversationEngineInput): ConversationContext {
    const { executiveSummary, nextMonthFocus } = input.review;
    return {
      kind: "REVIEW",
      intentType: intent.type,
      review: input.review,
      evidence: evidence({
        supportingInsightIds: [...executiveSummary.referencedInsightIds, ...nextMonthFocus.referencedInsightIds],
        supportingRecommendationIds: [
          ...executiveSummary.referencedRecommendationIds,
          ...nextMonthFocus.referencedRecommendationIds,
        ],
        supportingMetricTypes: nextMonthFocus.referencedMetricTypes,
      }),
    };
  }

  private buildLargestExpenseContext(intent: ConversationIntent, input: ConversationEngineInput): ConversationContext {
    const block = input.storySnapshot.stories
      .flatMap(s => s.blocks)
      .find(b => b.blockType === StoryBlockType.LARGEST_EXPENSE);

    if (!block) return { kind: "NOT_FOUND", intentType: intent.type, requestedId: null };

    return { kind: "STORY_BLOCK", intentType: intent.type, block, evidence: block.evidence };
  }

  private buildExplainStoryContext(intent: ConversationIntent, input: ConversationEngineInput): ConversationContext {
    if (!intent.referencedId) return { kind: "NOT_FOUND", intentType: intent.type, requestedId: null };

    const block = input.storySnapshot.stories
      .flatMap(s => s.blocks)
      .find(b => b.id === intent.referencedId);

    if (!block) return { kind: "NOT_FOUND", intentType: intent.type, requestedId: intent.referencedId };

    return { kind: "STORY_BLOCK", intentType: intent.type, block, evidence: block.evidence };
  }

  private buildExplainRecommendationContext(
    intent: ConversationIntent,
    input: ConversationEngineInput,
  ): ConversationContext {
    if (!intent.referencedId) return { kind: "NOT_FOUND", intentType: intent.type, requestedId: null };

    const recommendation = input.recommendationSnapshot.recommendations.find(r => r.id === intent.referencedId);
    if (!recommendation) return { kind: "NOT_FOUND", intentType: intent.type, requestedId: intent.referencedId };

    return {
      kind: "RECOMMENDATION",
      intentType: intent.type,
      recommendation,
      evidence: evidence({
        supportingRecommendationIds: [recommendation.id],
        supportingInsightIds: recommendation.supportingInsightIds,
        supportingFindingIds: recommendation.supportingFindingIds,
        supportingMetricTypes: recommendation.supportingMetricTypes as ReadonlyArray<MetricType>,
      }),
    };
  }

  private buildRiskOrGoalContext(
    intent: ConversationIntent,
    input: ConversationEngineInput,
    which: "RISK" | "GOAL",
  ): ConversationContext {
    let insightId: string | null;
    let recommendationId: string | null;

    if (which === "RISK") {
      const { risks } = input.review;
      insightId = risks.riskInsightIds[0] ?? risks.warningInsightIds[0] ?? null;
      recommendationId = risks.urgentRecommendationIds[0] ?? null;
    } else {
      const { goalProgress } = input.review;
      insightId = goalProgress.goalInsightIds[0] ?? goalProgress.milestoneInsightIds[0] ?? null;
      recommendationId = goalProgress.goalRecommendationIds[0] ?? null;
    }

    const insight = insightId ? input.insightSnapshot.insights.find(i => i.id === insightId) ?? null : null;
    const recommendation = recommendationId
      ? input.recommendationSnapshot.recommendations.find(r => r.id === recommendationId) ?? null
      : null;

    if (!insight && !recommendation) return { kind: "NOT_FOUND", intentType: intent.type, requestedId: null };

    return {
      kind: "RISK_OR_GOAL",
      intentType: intent.type,
      insight,
      recommendation,
      evidence: evidence({
        supportingInsightIds: insight ? [insight.id] : [],
        supportingRecommendationIds: recommendation ? [recommendation.id] : [],
      }),
    };
  }

  private buildChangesContext(intent: ConversationIntent, input: ConversationEngineInput): ConversationContext {
    const insights = input.insightSnapshot.insights.filter(i => i.type !== InsightType.NEUTRAL);

    return {
      kind: "CHANGES",
      intentType: intent.type,
      insights,
      evidence: evidence({ supportingInsightIds: insights.map(i => i.id) }),
    };
  }
}
