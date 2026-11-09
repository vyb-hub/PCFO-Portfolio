import { describe, it, expect } from "vitest";
import { ClosingConversationEventMapper } from "../ClosingConversationEventMapper";
import { ConversationIntentType } from "../../conversation/ConversationIntentType";
import type { ClosingConversationEvent } from "../events/ClosingConversationEvent";

describe("ClosingConversationEventMapper.toConversationContext()", () => {
  const mapper = new ClosingConversationEventMapper();

  it("maps STATEMENT_MISSING to a CLOSING_NOTICE context carrying the missing labels", () => {
    const event: ClosingConversationEvent = {
      kind: "STATEMENT_MISSING",
      userId: "u1",
      monthId: "m1",
      periodLabel: "2026-07",
      missingLabels: ["HDFC Savings", "ICICI Credit Card"],
    };
    const { intentType, context } = mapper.toConversationContext(event);

    expect(intentType).toBe(ConversationIntentType.STATEMENT_MISSING);
    expect(context.kind).toBe("CLOSING_NOTICE");
    if (context.kind === "CLOSING_NOTICE") {
      expect(context.periodLabel).toBe("2026-07");
      expect(context.missingLabels).toEqual(["HDFC Savings", "ICICI Credit Card"]);
    }
  });

  it("maps MONTH_READY_TO_CLOSE to a CLOSING_NOTICE context with no missing labels", () => {
    const event: ClosingConversationEvent = {
      kind: "MONTH_READY_TO_CLOSE",
      userId: "u1",
      monthId: "m1",
      periodLabel: "2026-07",
    };
    const { intentType, context } = mapper.toConversationContext(event);

    expect(intentType).toBe(ConversationIntentType.MONTH_READY_TO_CLOSE);
    expect(context.kind).toBe("CLOSING_NOTICE");
    if (context.kind === "CLOSING_NOTICE") expect(context.missingLabels).toEqual([]);
  });

  it("maps MONTH_CLOSED to a CLOSING_NOTICE context", () => {
    const event: ClosingConversationEvent = { kind: "MONTH_CLOSED", userId: "u1", monthId: "m1", periodLabel: "2026-07" };
    const { intentType, context } = mapper.toConversationContext(event);

    expect(intentType).toBe(ConversationIntentType.MONTH_CLOSED);
    expect(context.kind).toBe("CLOSING_NOTICE");
  });

  it("maps SALARY_CONFIRMED to a CLOSING_NOTICE context", () => {
    const event: ClosingConversationEvent = { kind: "SALARY_CONFIRMED", userId: "u1", monthId: "m1", periodLabel: "2026-07" };
    const { intentType, context } = mapper.toConversationContext(event);

    expect(intentType).toBe(ConversationIntentType.SALARY_CONFIRMED);
    expect(context.kind).toBe("CLOSING_NOTICE");
  });
});
