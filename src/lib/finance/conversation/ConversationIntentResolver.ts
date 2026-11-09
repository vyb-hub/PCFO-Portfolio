import type { IConversationIntentResolver } from "./IConversationIntentResolver";
import type { ConversationIntent } from "./ConversationIntent";
import { ConversationIntentType } from "./ConversationIntentType";

/** Slash commands with no argument. Checked before keyword fallback. */
const COMMANDS: Readonly<Record<string, ConversationIntentType>> = Object.freeze({
  "/daily": ConversationIntentType.DAILY_BRIEF,
  "/brief": ConversationIntentType.DAILY_BRIEF,
  "/weekly": ConversationIntentType.WEEKLY_REVIEW,
  "/monthly": ConversationIntentType.MONTHLY_REVIEW,
  "/review": ConversationIntentType.MONTHLY_REVIEW,
  "/health": ConversationIntentType.FINANCIAL_HEALTH,
  "/expense": ConversationIntentType.LARGEST_EXPENSE,
  "/largestexpense": ConversationIntentType.LARGEST_EXPENSE,
  "/risk": ConversationIntentType.TOP_RISK,
  "/goals": ConversationIntentType.GOAL_PROGRESS,
  "/whatschanged": ConversationIntentType.WHATS_CHANGED,
  "/changes": ConversationIntentType.WHATS_CHANGED,
});

/** Slash commands that take a trailing id argument, e.g. "/explainstory block-123". */
const ID_COMMANDS: Readonly<Record<string, ConversationIntentType>> = Object.freeze({
  "/explainstory": ConversationIntentType.EXPLAIN_STORY,
  "/explainrec": ConversationIntentType.EXPLAIN_RECOMMENDATION,
  "/explainrecommendation": ConversationIntentType.EXPLAIN_RECOMMENDATION,
});

/** Keyword fallback for free text. Phrases take priority over single words within each list. */
const KEYWORD_PATTERNS: ReadonlyArray<{
  intent: ConversationIntentType;
  keywords: ReadonlyArray<string>;
}> = Object.freeze([
  { intent: ConversationIntentType.LARGEST_EXPENSE, keywords: [
    "largest expense", "biggest expense", "biggest purchase", "what did i spend the most on",
  ] },
  { intent: ConversationIntentType.FINANCIAL_HEALTH, keywords: [
    "financial health", "how am i doing", "overall health", "health check",
  ] },
  { intent: ConversationIntentType.TOP_RISK, keywords: [
    "top risk", "biggest risk", "what should i worry about", "risks",
  ] },
  { intent: ConversationIntentType.GOAL_PROGRESS, keywords: [
    "goal progress", "my goals", "am i on track",
  ] },
  { intent: ConversationIntentType.WHATS_CHANGED, keywords: [
    "what changed", "what's new", "changes this month",
  ] },
  { intent: ConversationIntentType.WEEKLY_REVIEW, keywords: [
    "weekly review", "this week", "week in review",
  ] },
  { intent: ConversationIntentType.MONTHLY_REVIEW, keywords: [
    "monthly review", "month in review",
  ] },
  { intent: ConversationIntentType.DAILY_BRIEF, keywords: [
    "daily brief", "today's summary", "brief me",
  ] },
]);

function unknown(rawInput: string): ConversationIntent {
  return Object.freeze({
    type: ConversationIntentType.UNKNOWN,
    rawInput,
    referencedId: null,
    confidence: 0,
    matchedKeywords: Object.freeze([]),
  });
}

/**
 * Deterministic command + keyword resolver for the Conversation Platform.
 *
 * Resolution order:
 *   1. Exact slash command (no argument) — confidence 1.0
 *   2. Slash command with an id argument — confidence 1.0, referencedId set
 *   3. Keyword fallback over free text — confidence = matched/total keywords
 *   4. UNKNOWN — confidence 0
 */
export class ConversationIntentResolver implements IConversationIntentResolver {
  resolve(rawInput: string): ConversationIntent {
    const trimmed = rawInput.trim();
    const normalised = trimmed.toLowerCase();

    if (trimmed.startsWith("/")) {
      // Split the ORIGINAL (not lowercased) string so an id argument keeps its
      // real casing — Recommendation/StoryBlock ids are uppercase-conventioned
      // and a lowercased lookup would never match.
      const [rawCommand, ...rawRest] = trimmed.split(/\s+/);
      const command = (rawCommand ?? "").toLowerCase();

      const exact = COMMANDS[command];
      if (exact !== undefined) {
        return Object.freeze({
          type: exact,
          rawInput,
          referencedId: null,
          confidence: 1.0,
          matchedKeywords: Object.freeze([command]),
        });
      }

      const withId = ID_COMMANDS[command];
      if (withId !== undefined) {
        const id = rawRest.join(" ").trim();
        return Object.freeze({
          type: withId,
          rawInput,
          referencedId: id.length > 0 ? id : null,
          confidence: 1.0,
          matchedKeywords: Object.freeze([command]),
        });
      }

      return unknown(rawInput);
    }

    let bestIntent: ConversationIntentType | null = null;
    let bestMatchCount = 0;
    let bestKeywordCount = 1;
    let bestMatched: string[] = [];

    for (const { intent, keywords } of KEYWORD_PATTERNS) {
      const matched = keywords.filter(kw => normalised.includes(kw));
      if (matched.length > bestMatchCount) {
        bestMatchCount = matched.length;
        bestIntent = intent;
        bestKeywordCount = keywords.length;
        bestMatched = matched;
      }
    }

    if (bestIntent === null) return unknown(rawInput);

    return Object.freeze({
      type: bestIntent,
      rawInput,
      referencedId: null,
      confidence: Math.min(1, bestMatchCount / bestKeywordCount),
      matchedKeywords: Object.freeze(bestMatched),
    });
  }

  resolveCallback(callbackData: string): ConversationIntent {
    const [typeStr, id] = callbackData.split(":");
    const type = Object.values(ConversationIntentType).find(t => t === typeStr);
    if (type === undefined) return unknown(callbackData);

    return Object.freeze({
      type,
      rawInput: callbackData,
      referencedId: id !== undefined && id.length > 0 ? id : null,
      confidence: 1.0,
      matchedKeywords: Object.freeze([]),
    });
  }
}
