import { describe, it, expect } from "vitest";
import { composeConversationResponse } from "../ConversationResponseComposer";
import { NullConversationResponder } from "../NullConversationResponder";
import { ConversationIntentType } from "../ConversationIntentType";
import type { ConversationContext } from "../ConversationContext";
import type { IConversationResponder } from "../IConversationResponder";

/** These duplicate ConversationEngine's own composer coverage on purpose —
 * composeConversationResponse() is now the shared unit both ConversationEngine
 * and Financial Closing's proactive path (via FinancialClosingNotifier) call
 * directly, so it needs its own direct test independent of either caller. */
describe("composeConversationResponse()", () => {
  const closingNotice: ConversationContext = {
    kind: "CLOSING_NOTICE",
    intentType: ConversationIntentType.MONTH_READY_TO_CLOSE,
    periodLabel: "2026-07",
    missingLabels: [],
  };

  it("formats the context, passes it through the responder, and freezes the result", async () => {
    const response = await composeConversationResponse(
      closingNotice,
      { userId: "u1", intentType: ConversationIntentType.MONTH_READY_TO_CLOSE, rawInput: "[system:MONTH_READY_TO_CLOSE]", confidence: 1 },
      new NullConversationResponder(),
    );

    expect(response.userId).toBe("u1");
    expect(response.intentType).toBe(ConversationIntentType.MONTH_READY_TO_CLOSE);
    expect(response.text).toContain("2026-07");
    expect(Object.isFrozen(response)).toBe(true);
  });

  it("falls back to empty evidence for contexts that carry none (e.g. CLOSING_NOTICE)", async () => {
    const response = await composeConversationResponse(
      closingNotice,
      { userId: "u1", intentType: ConversationIntentType.MONTH_READY_TO_CLOSE, rawInput: "x", confidence: 1 },
      new NullConversationResponder(),
    );

    expect(response.evidence.supportingInsightIds).toEqual([]);
  });

  it("lets the responder rewrite the final text", async () => {
    const rewriting: IConversationResponder = {
      async respond(_context, draft) {
        return { ...draft, text: `[rewritten] ${draft.text}` };
      },
    };

    const response = await composeConversationResponse(
      closingNotice,
      { userId: "u1", intentType: ConversationIntentType.MONTH_READY_TO_CLOSE, rawInput: "x", confidence: 1 },
      rewriting,
    );

    expect(response.text.startsWith("[rewritten]")).toBe(true);
  });
});
