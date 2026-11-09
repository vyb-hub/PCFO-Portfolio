import type { ConversationContext } from "./ConversationContext";
import type { FormattedMessage } from "./FormattedMessage";
import { quickReply } from "./FormattedMessage";
import { ConversationIntentType } from "./ConversationIntentType";

function noReplies(title: string | null, text: string): FormattedMessage {
  return Object.freeze({ title, text, quickReplies: Object.freeze([]) });
}

/**
 * Pure: ConversationContext -> FormattedMessage. Deterministic given
 * identical input — no AI, no randomness, no Date.now() inside the copy.
 *
 * This is where the actual "turn already-computed data into English" work
 * happens for the REVIEW/RISK_OR_GOAL/CHANGES contexts (mirrors
 * story/StoryTemplates' role). STORY_BLOCK contexts already carry
 * ready-to-render prose from the Story Engine and are used near-verbatim.
 */
export const ConversationFormatter = {
  format(context: ConversationContext): FormattedMessage {
    switch (context.kind) {
      case "STORY_BLOCK":
        return noReplies(
          context.block.title,
          `${context.block.summary}\n\n${context.block.explanation}\n\n` +
            `Should I care? ${context.block.userImpact}\n\n` +
            `What to do: ${context.block.recommendedAction}`,
        );

      case "REVIEW":
        return formatReview(context);

      case "RISK_OR_GOAL":
        return formatRiskOrGoal(context);

      case "RECOMMENDATION":
        return noReplies(
          context.recommendation.title,
          `${context.recommendation.rationale}\n\n` +
            context.recommendation.impacts.map(i => `• ${i.description}`).join("\n"),
        );

      case "CHANGES":
        return formatChanges(context);

      case "NOT_FOUND":
        return formatNotFound(context);

      case "HELP":
        return noReplies(
          "PCFO Copilot",
          "Here's what you can ask me:\n\n" +
            "/daily — today's brief\n" +
            "/weekly — this week's review\n" +
            "/monthly — this month's review\n" +
            "/health — financial health summary\n" +
            "/expense — largest expense this month\n" +
            "/risk — top risk right now\n" +
            "/goals — goal progress\n" +
            "/whatschanged — what changed this month",
        );

      case "CLOSING_NOTICE":
        return formatClosingNotice(context);
    }
  },
} as const;

function formatReview(context: Extract<ConversationContext, { kind: "REVIEW" }>): FormattedMessage {
  const { review, intentType } = context;
  const { executiveSummary, financialHealth, achievements, risks, nextMonthFocus } = review;
  const healthLine = `Health: ${executiveSummary.healthTier} (${Math.round(executiveSummary.overallHealthScore * 100)}% of tracked metrics healthy).`;

  if (intentType === ConversationIntentType.FINANCIAL_HEALTH) {
    return noReplies(
      "Financial Health",
      `${healthLine}\n` +
        `${financialHealth.healthyMetricCount} healthy / ${financialHealth.unhealthyMetricCount} need attention.\n` +
        `${executiveSummary.criticalInsightCount} critical and ${executiveSummary.highInsightCount} high-severity issues; ` +
        `${executiveSummary.positiveSignalCount} positive signal(s) this period.`,
    );
  }

  if (intentType === ConversationIntentType.DAILY_BRIEF) {
    return noReplies(
      "Daily Brief",
      `${healthLine}\n` +
        `${executiveSummary.criticalRecommendationCount + executiveSummary.highRecommendationCount} action(s) pending. ` +
        `${financialHealth.unhealthyMetricCount} metric(s) to watch.`,
    );
  }

  const title = intentType === ConversationIntentType.WEEKLY_REVIEW ? "Weekly Review" : "Monthly Review";
  return noReplies(
    title,
    `${healthLine}\n` +
      `${achievements.totalAchievements} achievement(s), ${risks.criticalRiskCount + risks.highRiskCount} active risk(s).\n` +
      `Focus for next period: ${nextMonthFocus.priorityActionIds.length} priority action(s), ` +
      `${nextMonthFocus.watchlistMetricTypes.length} metric(s) on the watchlist.`,
  );
}

function formatRiskOrGoal(context: Extract<ConversationContext, { kind: "RISK_OR_GOAL" }>): FormattedMessage {
  const { insight, recommendation, intentType } = context;
  const title = intentType === ConversationIntentType.TOP_RISK ? "Top Risk" : "Goal Progress";

  const parts: string[] = [];
  if (insight) parts.push(`${insight.title}\n${insight.summary}`);
  if (recommendation) parts.push(`Recommended: ${recommendation.title}\n${recommendation.rationale}`);

  const quickReplies = recommendation
    ? [quickReply("Explain this recommendation", ConversationIntentType.EXPLAIN_RECOMMENDATION, recommendation.id)]
    : [];

  return Object.freeze({ title, text: parts.join("\n\n"), quickReplies: Object.freeze(quickReplies) });
}

function formatChanges(context: Extract<ConversationContext, { kind: "CHANGES" }>): FormattedMessage {
  if (context.insights.length === 0) {
    return noReplies(
      "What Changed",
      "Not enough history yet to tell what changed — check back after a few more months of data.",
    );
  }

  const top = context.insights.slice(0, 5);
  const text = top.map(i => `• ${i.title} — ${i.summary}`).join("\n");
  return noReplies("What Changed", text);
}

/** Financial Closing's proactive notices (EC-013) — same intentType-branching style as formatReview(). */
function formatClosingNotice(context: Extract<ConversationContext, { kind: "CLOSING_NOTICE" }>): FormattedMessage {
  switch (context.intentType) {
    case ConversationIntentType.STATEMENT_MISSING:
      return noReplies(
        "Statement Missing",
        `Still waiting on: ${context.missingLabels.join(", ")} for ${context.periodLabel}.`,
      );
    case ConversationIntentType.MONTH_READY_TO_CLOSE:
      return noReplies(
        "Ready to Close",
        `${context.periodLabel} is ready to close — every expected statement is in and salary is confirmed.`,
      );
    case ConversationIntentType.MONTH_CLOSED:
      return noReplies(
        "Month Closed",
        `${context.periodLabel} is closed. This month's review is now pinned as the permanent historical record.`,
      );
    case ConversationIntentType.SALARY_CONFIRMED:
      return noReplies("Salary Confirmed", `Salary confirmed for ${context.periodLabel}.`);
    default:
      return noReplies(null, `Update for ${context.periodLabel}.`);
  }
}

function formatNotFound(context: Extract<ConversationContext, { kind: "NOT_FOUND" }>): FormattedMessage {
  const needsId =
    context.intentType === ConversationIntentType.EXPLAIN_STORY ||
    context.intentType === ConversationIntentType.EXPLAIN_RECOMMENDATION;

  if (needsId && context.requestedId === null) {
    return noReplies(null, "Please provide an id, e.g. /explainstory <id> or /explainrec <id>.");
  }
  if (needsId) {
    return noReplies(null, `I couldn't find anything matching "${context.requestedId}" — it may have expired.`);
  }
  return noReplies(null, "Not enough data yet for that — check back once more transactions come in.");
}
