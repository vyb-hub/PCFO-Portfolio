import { CoachIntentType, type CoachIntent } from "../CoachIntent";

/**
 * Classifies a user query into a CoachIntentType.
 *
 * Detection must be deterministic — no LLM is called. The result
 * drives which memory context is assembled and which prompt template
 * is selected.
 */
export interface IntentDetector {
  detect(query: string): CoachIntent;
}

/** Keyword patterns for each intent. Phrases take priority over single words. */
const INTENT_PATTERNS: ReadonlyArray<{
  intent: CoachIntentType;
  keywords: ReadonlyArray<string>;
}> = Object.freeze([
  {
    intent: CoachIntentType.AFFORDABILITY,
    keywords: [
      "can i afford",
      "should i buy",
      "can i buy",
      "is it worth",
      "afford",
      "purchase",
      "worth buying",
      "budget for",
    ],
  },
  {
    intent: CoachIntentType.DEBT,
    keywords: [
      "credit card",
      "debt",
      "loan",
      "mortgage",
      "emi",
      "repay",
      "pay off",
      "owing",
      "credit utilisation",
      "credit utilization",
      "dti",
      "debt to income",
    ],
  },
  {
    intent: CoachIntentType.SPENDING,
    keywords: [
      "spending",
      "expenses",
      "where is my money",
      "where am i spending",
      "outgoing",
      "burn rate",
      "recurring",
      "subscription",
      "overspending",
      "budget",
    ],
  },
  {
    intent: CoachIntentType.INVESTMENTS,
    keywords: [
      "invest",
      "investment",
      "portfolio",
      "stocks",
      "mutual fund",
      "sip",
      "returns",
      "market",
      "equity",
      "should i invest",
    ],
  },
  {
    intent: CoachIntentType.GOALS,
    keywords: [
      "goal",
      "target",
      "saving for",
      "house",
      "car",
      "emergency fund",
      "milestone",
      "on track",
      "savings target",
    ],
  },
  {
    intent: CoachIntentType.FORECASTING,
    keywords: [
      "forecast",
      "predict",
      "next month",
      "next year",
      "future",
      "trend",
      "will i",
      "when will",
      "trajectory",
      "projection",
    ],
  },
  {
    intent: CoachIntentType.FINANCIAL_HEALTH,
    keywords: [
      "how am i doing",
      "financial health",
      "overall",
      "summary",
      "net worth",
      "financial situation",
      "savings rate",
      "health check",
    ],
  },
]);

/**
 * Keyword-based intent detector.
 *
 * Algorithm:
 *   1. Normalise query to lowercase.
 *   2. For each intent pattern, count how many keywords appear in the query.
 *   3. The intent with the highest match count wins.
 *   4. Confidence = matched_count / keyword_count_for_that_intent (0–1).
 *   5. If no keywords match, return GENERAL with confidence 0.5.
 *
 * Longer keyword phrases (e.g. "can i afford") match before shorter ones,
 * so the patterns list is ordered with multi-word phrases first within
 * each intent's keyword set.
 */
export class DefaultIntentDetector implements IntentDetector {
  detect(query: string): CoachIntent {
    const normalised = query.toLowerCase();

    let bestIntent: CoachIntentType = CoachIntentType.GENERAL;
    let bestMatchCount = 0;
    let bestKeywordCount = 1;
    let bestMatched: string[] = [];

    for (const { intent, keywords } of INTENT_PATTERNS) {
      const matched: string[] = [];
      for (const kw of keywords) {
        if (normalised.includes(kw)) {
          matched.push(kw);
        }
      }
      if (matched.length > bestMatchCount) {
        bestMatchCount = matched.length;
        bestIntent = intent;
        bestKeywordCount = keywords.length;
        bestMatched = matched;
      }
    }

    if (bestMatchCount === 0) {
      return Object.freeze({
        type: CoachIntentType.GENERAL,
        confidence: 0.5,
        matchedKeywords: Object.freeze([]),
      });
    }

    return Object.freeze({
      type: bestIntent,
      confidence: Math.min(1, bestMatchCount / bestKeywordCount),
      matchedKeywords: Object.freeze(bestMatched),
    });
  }
}
