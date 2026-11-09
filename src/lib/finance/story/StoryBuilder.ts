import { randomUUID } from "crypto";
import type { StoryEngineInput } from "./StoryEngineInput";
import type { StoryBlock } from "./StoryBlock";
import type { FinancialStory } from "./FinancialStory";
import { StoryCategory } from "./StoryCategory";
import { StoryPriority } from "./StoryPriority";

const PRIORITY_ORDER: Record<StoryPriority, number> = {
  [StoryPriority.CRITICAL]: 0,
  [StoryPriority.HIGH]: 1,
  [StoryPriority.MEDIUM]: 2,
  [StoryPriority.LOW]: 3,
};

const CATEGORY_TITLE: Record<StoryCategory, string> = {
  [StoryCategory.CASH_FLOW]: "Cash Flow",
  [StoryCategory.SAVINGS]: "Savings",
  [StoryCategory.DEBT]: "Debt",
  [StoryCategory.SPENDING]: "Spending",
  [StoryCategory.INCOME]: "Income",
  [StoryCategory.INVESTMENTS]: "Investments",
  [StoryCategory.GOALS]: "Goals",
  [StoryCategory.FINANCIAL_HEALTH]: "Financial Health",
  [StoryCategory.RISK]: "Risk",
  [StoryCategory.OPPORTUNITIES]: "Opportunities",
  [StoryCategory.BEHAVIOUR]: "Behaviour",
  [StoryCategory.ANOMALIES]: "Anomalies",
  [StoryCategory.RECURRING_PAYMENTS]: "Recurring Payments",
  [StoryCategory.SUBSCRIPTIONS]: "Subscriptions",
  [StoryCategory.MONTHLY_HIGHLIGHTS]: "Monthly Highlights",
  [StoryCategory.MONTHLY_LOWLIGHTS]: "Monthly Lowlights",
};

/**
 * Assembles immutable FinancialStory containers from the flat list of
 * StoryBlocks every registered generator produced.
 *
 * StoryBuilder contains no interpretation logic. It groups blocks by
 * category, sorts each group by priority, and freezes the result — nothing
 * more. Mirrors FinancialReviewBuilder's "assembly layer, not calculation
 * layer" discipline (ADR-017 Decision 1).
 */
export class StoryBuilder {
  build(blocks: ReadonlyArray<StoryBlock>, input: StoryEngineInput): ReadonlyArray<FinancialStory> {
    const userId = input.aggregate.userId;
    const period = input.aggregate.period;
    const generatedAt = new Date();

    const byCategory = new Map<StoryCategory, StoryBlock[]>();
    for (const block of blocks) {
      const existing = byCategory.get(block.category);
      if (existing) {
        existing.push(block);
      } else {
        byCategory.set(block.category, [block]);
      }
    }

    const stories: FinancialStory[] = [];
    for (const [category, categoryBlocks] of byCategory) {
      const sorted = [...categoryBlocks].sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4),
      );

      stories.push(
        Object.freeze({
          id: randomUUID(),
          userId,
          category,
          period,
          title: CATEGORY_TITLE[category],
          blocks: Object.freeze(sorted),
          generatedAt,
          metadata: Object.freeze({ blockCount: sorted.length }),
        }),
      );
    }

    return Object.freeze(stories);
  }
}
