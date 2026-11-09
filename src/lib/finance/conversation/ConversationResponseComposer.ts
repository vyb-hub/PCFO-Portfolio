import { randomUUID } from "crypto";
import type { ConversationContext } from "./ConversationContext";
import type { ConversationResponse } from "./ConversationResponse";
import type { IConversationResponder } from "./IConversationResponder";
import type { ConversationIntentType } from "./ConversationIntentType";
import { ConversationFormatter } from "./ConversationFormatter";
import { EMPTY_STORY_EVIDENCE } from "../story/StoryEvidence";

/** Identifying/traceability fields ConversationEngine derives from a resolved
 * ConversationIntent; ClosingConversationEventMapper derives the equivalent
 * from a domain event instead. */
export interface ConversationResponseMeta {
  readonly userId: string;
  readonly intentType: ConversationIntentType;
  readonly rawInput: string;
  readonly confidence: number;
}

/**
 * Shared context -> response composition: format -> IConversationResponder
 * pass -> freeze. Extracted from ConversationEngine.handle() (EC-012) so both
 * the reactive command path (via the engine) and Financial Closing's
 * proactive event path (via ConversationDeliveryService, EC-013) produce a
 * ConversationResponse through exactly one implementation, reusing the same
 * formatter and AI boundary. See ADR-021.
 */
export async function composeConversationResponse(
  context: ConversationContext,
  meta: ConversationResponseMeta,
  responder: IConversationResponder,
): Promise<ConversationResponse> {
  const draft = ConversationFormatter.format(context);
  const final = await responder.respond(context, draft);

  return Object.freeze({
    id: randomUUID(),
    userId: meta.userId,
    intentType: meta.intentType,
    title: final.title,
    text: final.text,
    quickReplies: final.quickReplies,
    evidence: "evidence" in context ? context.evidence : EMPTY_STORY_EVIDENCE,
    generatedAt: new Date(),
    metadata: Object.freeze({
      rawInput: meta.rawInput,
      confidence: meta.confidence,
    }),
  });
}
