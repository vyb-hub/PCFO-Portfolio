import { describe, it, expect } from "vitest";
import { ConversationContextBuilder } from "../ConversationContextBuilder";
import { ConversationIntentType } from "../ConversationIntentType";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import { RecommendationCategory } from "../../recommendations/RecommendationCategory";
import { RecommendationPriority } from "../../recommendations/RecommendationPriority";
import { StoryBlockType } from "../../story/StoryBlockType";
import {
  makeConversationEngineInput,
  makeInsight,
  makeRecommendation,
  makeStoryBlock,
} from "./testHelpers";

function intent(type: ConversationIntentType, referencedId: string | null = null) {
  return { type, rawInput: "test", referencedId, confidence: 1, matchedKeywords: [] };
}

describe("ConversationContextBuilder — review-backed intents", () => {
  const builder = new ConversationContextBuilder();

  it.each([
    ConversationIntentType.DAILY_BRIEF,
    ConversationIntentType.WEEKLY_REVIEW,
    ConversationIntentType.MONTHLY_REVIEW,
    ConversationIntentType.FINANCIAL_HEALTH,
  ])("%s resolves to the FinancialReview", (type) => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(type), input);

    expect(context.kind).toBe("REVIEW");
    if (context.kind === "REVIEW") {
      expect(context.review).toBe(input.review);
    }
  });
});

describe("ConversationContextBuilder — LARGEST_EXPENSE", () => {
  const builder = new ConversationContextBuilder();

  it("resolves to the CASH_FLOW story's LARGEST_EXPENSE block", () => {
    const block = makeStoryBlock({ id: "b1" });
    const input = makeConversationEngineInput("u1", { storyBlocks: [block] });

    const context = builder.build(intent(ConversationIntentType.LARGEST_EXPENSE), input);

    expect(context.kind).toBe("STORY_BLOCK");
    if (context.kind === "STORY_BLOCK") {
      expect(context.block.id).toBe("b1");
      expect(context.evidence).toBe(block.evidence);
    }
  });

  it("returns NOT_FOUND when no story blocks exist", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.LARGEST_EXPENSE), input);
    expect(context.kind).toBe("NOT_FOUND");
  });
});

describe("ConversationContextBuilder — EXPLAIN_STORY", () => {
  const builder = new ConversationContextBuilder();

  it("resolves a StoryBlock by referencedId", () => {
    const block = makeStoryBlock({ id: "b42", blockType: StoryBlockType.LARGEST_EXPENSE });
    const input = makeConversationEngineInput("u1", { storyBlocks: [block] });

    const context = builder.build(intent(ConversationIntentType.EXPLAIN_STORY, "b42"), input);

    expect(context.kind).toBe("STORY_BLOCK");
    if (context.kind === "STORY_BLOCK") expect(context.block.id).toBe("b42");
  });

  it("returns NOT_FOUND(requestedId=null) when no id was provided", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.EXPLAIN_STORY, null), input);
    expect(context).toEqual({ kind: "NOT_FOUND", intentType: ConversationIntentType.EXPLAIN_STORY, requestedId: null });
  });

  it("returns NOT_FOUND(requestedId=id) when the id doesn't match any block", () => {
    const input = makeConversationEngineInput("u1", { storyBlocks: [makeStoryBlock({ id: "b1" })] });
    const context = builder.build(intent(ConversationIntentType.EXPLAIN_STORY, "nonexistent"), input);
    expect(context).toEqual({ kind: "NOT_FOUND", intentType: ConversationIntentType.EXPLAIN_STORY, requestedId: "nonexistent" });
  });
});

describe("ConversationContextBuilder — EXPLAIN_RECOMMENDATION", () => {
  const builder = new ConversationContextBuilder();

  it("resolves a Recommendation by referencedId with full evidence", () => {
    const rec = makeRecommendation("SAVINGS_RATE_LOW", RecommendationCategory.SAVINGS, RecommendationPriority.HIGH);
    const input = makeConversationEngineInput("u1", { recommendations: [rec] });

    const context = builder.build(intent(ConversationIntentType.EXPLAIN_RECOMMENDATION, "SAVINGS_RATE_LOW"), input);

    expect(context.kind).toBe("RECOMMENDATION");
    if (context.kind === "RECOMMENDATION") {
      expect(context.recommendation.id).toBe("SAVINGS_RATE_LOW");
      expect(context.evidence.supportingRecommendationIds).toEqual(["SAVINGS_RATE_LOW"]);
    }
  });

  it("returns NOT_FOUND when the id doesn't match", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.EXPLAIN_RECOMMENDATION, "NOPE"), input);
    expect(context.kind).toBe("NOT_FOUND");
  });
});

describe("ConversationContextBuilder — TOP_RISK / GOAL_PROGRESS", () => {
  const builder = new ConversationContextBuilder();

  it("TOP_RISK resolves the top risk insight and its urgent recommendation", () => {
    const riskInsight = makeInsight("RISK_1", InsightMetricCategory.DEBT, InsightType.RISK, InsightSeverityLevel.CRITICAL);
    const urgentRec = makeRecommendation("DEBT_DTI_EXCEEDED", RecommendationCategory.DEBT, RecommendationPriority.CRITICAL);
    const input = makeConversationEngineInput("u1", { insights: [riskInsight], recommendations: [urgentRec] });

    const context = builder.build(intent(ConversationIntentType.TOP_RISK), input);

    expect(context.kind).toBe("RISK_OR_GOAL");
    if (context.kind === "RISK_OR_GOAL") {
      expect(context.insight?.id).toBe("RISK_1");
      expect(context.recommendation?.id).toBe("DEBT_DTI_EXCEEDED");
    }
  });

  it("GOAL_PROGRESS returns NOT_FOUND when there's no goal signal", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.GOAL_PROGRESS), input);
    expect(context.kind).toBe("NOT_FOUND");
  });
});

describe("ConversationContextBuilder — WHATS_CHANGED", () => {
  const builder = new ConversationContextBuilder();

  it("filters out NEUTRAL insights", () => {
    const risk = makeInsight("R1", InsightMetricCategory.DEBT, InsightType.RISK);
    const neutral = makeInsight("N1", InsightMetricCategory.SAVINGS, InsightType.NEUTRAL);
    const input = makeConversationEngineInput("u1", { insights: [risk, neutral] });

    const context = builder.build(intent(ConversationIntentType.WHATS_CHANGED), input);

    expect(context.kind).toBe("CHANGES");
    if (context.kind === "CHANGES") {
      expect(context.insights.map(i => i.id)).toEqual(["R1"]);
    }
  });
});

describe("ConversationContextBuilder — UNKNOWN", () => {
  it("returns HELP", () => {
    const builder = new ConversationContextBuilder();
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.UNKNOWN), input);
    expect(context).toEqual({ kind: "HELP", intentType: ConversationIntentType.UNKNOWN });
  });
});
