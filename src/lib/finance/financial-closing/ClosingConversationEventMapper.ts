import { ConversationIntentType } from "../conversation/ConversationIntentType";
import type { ConversationContext } from "../conversation/ConversationContext";
import type { ClosingConversationEvent } from "./events/ClosingConversationEvent";

export interface MappedConversationEvent {
  readonly intentType: ConversationIntentType;
  readonly context: ConversationContext;
}

/**
 * Translates a Financial Closing domain event into the shapes the
 * Conversation Platform already knows how to format (a "CLOSING_NOTICE"
 * ConversationContext). The only file in the codebase that imports types
 * from both financial-closing/ (Level 11) and conversation/ (9.5) —
 * financial-closing/ is allowed to depend on conversation/; conversation/
 * never depends back. See ADR-021.
 */
export class ClosingConversationEventMapper {
  toConversationContext(event: ClosingConversationEvent): MappedConversationEvent {
    switch (event.kind) {
      case "STATEMENT_MISSING":
        return this.build(ConversationIntentType.STATEMENT_MISSING, event.periodLabel, event.missingLabels);
      case "MONTH_READY_TO_CLOSE":
        return this.build(ConversationIntentType.MONTH_READY_TO_CLOSE, event.periodLabel);
      case "MONTH_CLOSED":
        return this.build(ConversationIntentType.MONTH_CLOSED, event.periodLabel);
      case "SALARY_CONFIRMED":
        return this.build(ConversationIntentType.SALARY_CONFIRMED, event.periodLabel);
    }
  }

  private build(
    intentType: ConversationIntentType,
    periodLabel: string,
    missingLabels: ReadonlyArray<string> = [],
  ): MappedConversationEvent {
    return {
      intentType,
      context: { kind: "CLOSING_NOTICE", intentType, periodLabel, missingLabels },
    };
  }
}
