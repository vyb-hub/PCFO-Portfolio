import type { LargestExpenseFact } from "./generators/LargestExpenseFinder";
import { StoryFormatter } from "./StoryFormatter";
import { StoryPriority } from "./StoryPriority";

export interface StoryCopy {
  readonly title: string;
  readonly summary: string;
  readonly explanation: string;
  readonly userImpact: string;
  readonly recommendedAction: string;
  readonly priority: StoryPriority;
}

/**
 * Deterministic copy-generation functions, one per StoryBlockType.
 *
 * These are the actual "explain WHY" logic of the Story Engine: pure
 * functions from evidence to prose, no AI, no randomness, no Date.now()
 * inside the copy itself. Same determinism discipline as
 * insights/generators/InsightBuilder.buildInsight.
 *
 * Priority thresholds below are an initial, evidence-free calibration —
 * per the EC-011 charter, thresholds are NOT tuned during this milestone.
 * Observations from reviewing real output belong in
 * docs/product/PRODUCT_CALIBRATION_LOG_v1.0.md, not silent threshold edits.
 */
export const StoryTemplates = {
  largestExpense(fact: LargestExpenseFact): StoryCopy {
    const { transaction, totalExpenseAmount, percentOfTotalExpenses, multipleOfAverage } = fact;
    const who = transaction.merchant ?? transaction.description;
    const amount = StoryFormatter.currency(transaction.amount);
    const when = StoryFormatter.date(transaction.date);
    const pct = StoryFormatter.percent(percentOfTotalExpenses);
    const multiple = StoryFormatter.multiple(multipleOfAverage);

    const priority =
      percentOfTotalExpenses >= 0.40 ? StoryPriority.HIGH :
      percentOfTotalExpenses >= 0.20 ? StoryPriority.MEDIUM :
      StoryPriority.LOW;

    return {
      title: "Largest Expense This Month",
      summary: `${amount} to ${who} on ${when} was your biggest single expense this month.`,
      explanation:
        `Out of ${fact.transactionCount} expense transactions totalling ${StoryFormatter.currency(totalExpenseAmount)} ` +
        `this period, this one transaction to ${who} accounts for ${pct} of everything you spent — ` +
        `${multiple} your average transaction size.`,
      userImpact: percentOfTotalExpenses >= 0.40
        ? `This single transaction made up a large share (${pct}) of this month's spending. ` +
          `It's worth knowing whether it was planned or one-off before it repeats.`
        : `This wasn't a dominant share of your spending (${pct}), but it's still the single ` +
          `largest transaction this month and worth a quick look.`,
      recommendedAction: transaction.isRecurring
        ? `This transaction is marked recurring — check whether it's expected to happen again next month and whether it still fits your budget.`
        : `If this was a one-off, no action needed. If it's likely to recur, consider budgeting for it ahead of time.`,
      priority,
    };
  },
} as const;
