import type { ConversationIntentType } from "./ConversationIntentType";
import type { StoryBlock } from "../story/StoryBlock";
import type { FinancialReview } from "../reviews/FinancialReview";
import type { FinancialInsight } from "../insights/FinancialInsight";
import type { Recommendation } from "../recommendations/Recommendation";
import type { StoryEvidence } from "../story/StoryEvidence";

/**
 * The resolved, intent-specific bundle ConversationContextBuilder produces.
 *
 * Each variant carries the RAW already-computed source object(s) selected
 * for the intent — never synthesized prose. ConversationContextBuilder's job
 * stops at selection and ID resolution; turning these into sentences is
 * ConversationFormatter's job (mirroring the StoryBuilder/StoryTemplates
 * split: assembly is not interpretation).
 *
 * `evidence` is always a StoryEvidence-shaped ID bundle (reused, not
 * duplicated) so every ConversationResponse stays traceable back to its
 * source snapshots, same discipline as StoryBlock.evidence.
 */
export type ConversationContext =
  | {
      readonly kind: "STORY_BLOCK";
      readonly intentType: ConversationIntentType;
      readonly block: StoryBlock;
      readonly evidence: StoryEvidence;
    }
  | {
      readonly kind: "REVIEW";
      readonly intentType: ConversationIntentType;
      readonly review: FinancialReview;
      readonly evidence: StoryEvidence;
    }
  | {
      readonly kind: "RISK_OR_GOAL";
      readonly intentType: ConversationIntentType;
      readonly insight: FinancialInsight | null;
      readonly recommendation: Recommendation | null;
      readonly evidence: StoryEvidence;
    }
  | {
      readonly kind: "RECOMMENDATION";
      readonly intentType: ConversationIntentType;
      readonly recommendation: Recommendation;
      readonly evidence: StoryEvidence;
    }
  | {
      readonly kind: "CHANGES";
      readonly intentType: ConversationIntentType;
      readonly insights: ReadonlyArray<FinancialInsight>;
      readonly evidence: StoryEvidence;
    }
  | {
      readonly kind: "NOT_FOUND";
      readonly intentType: ConversationIntentType;
      readonly requestedId: string | null;
    }
  | {
      readonly kind: "HELP";
      readonly intentType: ConversationIntentType;
    }
  | {
      /**
       * Financial Closing's proactive notifications (EC-013) — built directly
       * by ClosingConversationEventMapper from a domain event, never by
       * ConversationContextBuilder (there is no user intent to resolve for
       * these; intentType here only tags which of the 4 notice kinds this
       * is, same branching pattern as "REVIEW"'s intentType checks below).
       * No `evidence` — nothing here traces back to an insight/recommendation.
       */
      readonly kind: "CLOSING_NOTICE";
      readonly intentType: ConversationIntentType;
      readonly periodLabel: string;
      readonly missingLabels: ReadonlyArray<string>;
    };
