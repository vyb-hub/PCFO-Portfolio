import { describe, it, expect } from "vitest";
import { ConversationEngine } from "../ConversationEngine";
import { NullConversationResponder } from "../NullConversationResponder";
import { ConversationIntentType } from "../ConversationIntentType";
import type { IConversationResponder } from "../IConversationResponder";
import type { ConversationContext } from "../ConversationContext";
import type { FormattedMessage } from "../FormattedMessage";
import { makeConversationEngineInput, makeStoryBlock } from "./testHelpers";

function intent(type: ConversationIntentType, referencedId: string | null = null) {
  return { type, rawInput: "test", referencedId, confidence: 1, matchedKeywords: [] };
}

describe("ConversationEngine — handle()", () => {
  it("returns a frozen ConversationResponse with NullConversationResponder passing the draft through unchanged", async () => {
    const engine = new ConversationEngine(new NullConversationResponder());
    const block = makeStoryBlock({ id: "b1" });
    const input = makeConversationEngineInput("u1", { storyBlocks: [block] });

    const response = await engine.handle(intent(ConversationIntentType.LARGEST_EXPENSE), input);

    expect(response.userId).toBe("u1");
    expect(response.intentType).toBe(ConversationIntentType.LARGEST_EXPENSE);
    expect(response.title).toBe(block.title);
    expect(response.text).toContain(block.summary);
    expect(response.evidence).toBe(block.evidence);
    expect(Object.isFrozen(response)).toBe(true);
  });

  it("calls the responder with the resolved context and the formatter's draft", async () => {
    let received: { context: ConversationContext; draft: FormattedMessage } | null = null;
    const spyResponder: IConversationResponder = {
      async respond(context, draft) {
        received = { context, draft };
        return draft;
      },
    };

    const engine = new ConversationEngine(spyResponder);
    const input = makeConversationEngineInput("u1");
    await engine.handle(intent(ConversationIntentType.FINANCIAL_HEALTH), input);

    expect(received).not.toBeNull();
    expect(received!.context.kind).toBe("REVIEW");
    expect(received!.draft.title).toBe("Financial Health");
  });

  it("lets the responder rewrite the final text without ConversationEngine knowing how", async () => {
    const rewritingResponder: IConversationResponder = {
      async respond(_context, draft) {
        return { ...draft, text: `[rewritten] ${draft.text}` };
      },
    };

    const engine = new ConversationEngine(rewritingResponder);
    const input = makeConversationEngineInput("u1");
    const response = await engine.handle(intent(ConversationIntentType.UNKNOWN), input);

    expect(response.text.startsWith("[rewritten]")).toBe(true);
  });

  it("falls back to empty evidence for HELP/NOT_FOUND contexts that carry none", async () => {
    const engine = new ConversationEngine(new NullConversationResponder());
    const input = makeConversationEngineInput("u1");

    const response = await engine.handle(intent(ConversationIntentType.UNKNOWN), input);

    expect(response.evidence.supportingInsightIds).toEqual([]);
    expect(response.evidence.supportingRecommendationIds).toEqual([]);
  });
});
