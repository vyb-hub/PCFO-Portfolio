import { describe, it, expect } from "vitest";
import { ConversationFormatter } from "../ConversationFormatter";
import { ConversationIntentType } from "../ConversationIntentType";
import { EMPTY_STORY_EVIDENCE } from "../../story/StoryEvidence";
import { RecommendationCategory } from "../../recommendations/RecommendationCategory";
import { RecommendationPriority } from "../../recommendations/RecommendationPriority";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { makeConversationEngineInput, makeInsight, makeRecommendation, makeStoryBlock } from "./testHelpers";
import { ConversationContextBuilder } from "../ConversationContextBuilder";

function intent(type: ConversationIntentType, referencedId: string | null = null) {
  return { type, rawInput: "test", referencedId, confidence: 1, matchedKeywords: [] };
}

const builder = new ConversationContextBuilder();

describe("ConversationFormatter — STORY_BLOCK", () => {
  it("renders the block's own prose verbatim", () => {
    const block = makeStoryBlock({ title: "Largest Expense This Month", summary: "S", explanation: "E", userImpact: "U", recommendedAction: "A" });
    const message = ConversationFormatter.format({ kind: "STORY_BLOCK", intentType: ConversationIntentType.LARGEST_EXPENSE, block, evidence: EMPTY_STORY_EVIDENCE });

    expect(message.title).toBe("Largest Expense This Month");
    expect(message.text).toContain("S");
    expect(message.text).toContain("E");
    expect(message.text).toContain("U");
    expect(message.text).toContain("A");
  });
});

describe("ConversationFormatter — REVIEW", () => {
  it("FINANCIAL_HEALTH mentions the health tier", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.FINANCIAL_HEALTH), input);
    const message = ConversationFormatter.format(context);

    expect(message.title).toBe("Financial Health");
    expect(message.text).toContain(input.review.executiveSummary.healthTier);
  });

  it("DAILY_BRIEF is a short compact rendering", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.DAILY_BRIEF), input);
    const message = ConversationFormatter.format(context);
    expect(message.title).toBe("Daily Brief");
  });

  it("is deterministic given identical input", () => {
    const input = makeConversationEngineInput("u1");
    const context = builder.build(intent(ConversationIntentType.MONTHLY_REVIEW), input);
    expect(ConversationFormatter.format(context)).toEqual(ConversationFormatter.format(context));
  });
});

describe("ConversationFormatter — RISK_OR_GOAL", () => {
  it("offers an EXPLAIN_RECOMMENDATION quick reply when a recommendation was resolved", () => {
    const riskInsight = makeInsight("R1", InsightMetricCategory.DEBT, InsightType.RISK);
    const rec = makeRecommendation("DEBT_DTI_EXCEEDED", RecommendationCategory.DEBT, RecommendationPriority.CRITICAL);
    const input = makeConversationEngineInput("u1", { insights: [riskInsight], recommendations: [rec] });
    const context = builder.build(intent(ConversationIntentType.TOP_RISK), input);

    const message = ConversationFormatter.format(context);

    expect(message.quickReplies.length).toBe(1);
    expect(message.quickReplies[0]!.callbackData).toBe(`${ConversationIntentType.EXPLAIN_RECOMMENDATION}:DEBT_DTI_EXCEEDED`);
  });
});

describe("ConversationFormatter — CHANGES", () => {
  it("degrades gracefully when there are no non-neutral insights", () => {
    const message = ConversationFormatter.format({ kind: "CHANGES", intentType: ConversationIntentType.WHATS_CHANGED, insights: [], evidence: EMPTY_STORY_EVIDENCE });
    expect(message.text).toContain("Not enough history yet");
  });

  it("caps the list at 5 insights", () => {
    const insights = Array.from({ length: 8 }, (_, i) => makeInsight(`I${i}`, InsightMetricCategory.SAVINGS, InsightType.RISK));
    const message = ConversationFormatter.format({ kind: "CHANGES", intentType: ConversationIntentType.WHATS_CHANGED, insights, evidence: EMPTY_STORY_EVIDENCE });
    expect(message.text.split("\n").length).toBe(5);
  });
});

describe("ConversationFormatter — NOT_FOUND", () => {
  it("asks for an id when EXPLAIN_STORY has none", () => {
    const message = ConversationFormatter.format({ kind: "NOT_FOUND", intentType: ConversationIntentType.EXPLAIN_STORY, requestedId: null });
    expect(message.text).toContain("Please provide an id");
  });

  it("reports the unmatched id when one was given", () => {
    const message = ConversationFormatter.format({ kind: "NOT_FOUND", intentType: ConversationIntentType.EXPLAIN_STORY, requestedId: "xyz" });
    expect(message.text).toContain("xyz");
  });

  it("uses a not-enough-data message for non-EXPLAIN intents", () => {
    const message = ConversationFormatter.format({ kind: "NOT_FOUND", intentType: ConversationIntentType.LARGEST_EXPENSE, requestedId: null });
    expect(message.text).toContain("Not enough data yet");
  });
});

describe("ConversationFormatter — HELP", () => {
  it("lists available commands", () => {
    const message = ConversationFormatter.format({ kind: "HELP", intentType: ConversationIntentType.UNKNOWN });
    expect(message.text).toContain("/daily");
    expect(message.text).toContain("/health");
  });
});
