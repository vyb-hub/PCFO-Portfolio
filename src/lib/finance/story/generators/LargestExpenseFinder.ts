import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";
import type { TransactionRecord } from "../../types/TransactionRecord";
import type { Money } from "../../types/Money";
import { MoneyUtils } from "../../utils/MoneyUtils";

/**
 * The raw fact "largest expense this month" plus the minimal context needed
 * to narrate it (how it compares to the period's total and average spend).
 *
 * Every field here is a direct read or a single division/sum over values
 * already materialized on FinancialAggregate — no thresholds, no scoring,
 * no health judgment. This is the sanctioned exception in ADR-019 Decision 4:
 * a pure fact-finder, physically inside story/, distinct from the generator
 * that narrates it. If more of these accumulate across future story
 * categories, extracting a dedicated facts/ layer becomes justified — not yet.
 */
export interface LargestExpenseFact {
  readonly transaction: TransactionRecord;
  readonly totalExpenseAmount: Money;
  readonly transactionCount: number;
  readonly averageTransactionAmount: Money;
  /** transaction.amount / totalExpenseAmount, 0-1. */
  readonly percentOfTotalExpenses: number;
  /** transaction.amount / averageTransactionAmount, e.g. 3.2 = 3.2x the average. */
  readonly multipleOfAverage: number;
}

/**
 * Find the single largest DEBIT transaction in the aggregate's period.
 * Returns null when there are no expense transactions (e.g. no data yet).
 */
export function findLargestExpense(aggregate: FinancialAggregate): LargestExpenseFact | null {
  const expenses = aggregate.expenses.all;
  if (expenses.length === 0) return null;

  const largest = expenses.reduce((max, t) =>
    t.amount.amount > max.amount.amount ? t : max,
  );

  const totalExpenseAmount = MoneyUtils.sum(
    expenses.map((t) => t.amount),
    largest.amount.currency,
  );
  const averageTransactionAmount = MoneyUtils.multiply(
    totalExpenseAmount,
    1 / expenses.length,
  );

  const percentOfTotalExpenses = totalExpenseAmount.amount > 0
    ? largest.amount.amount / totalExpenseAmount.amount
    : 0;
  const multipleOfAverage = averageTransactionAmount.amount > 0
    ? largest.amount.amount / averageTransactionAmount.amount
    : 0;

  return {
    transaction: largest,
    totalExpenseAmount,
    transactionCount: expenses.length,
    averageTransactionAmount,
    percentOfTotalExpenses,
    multipleOfAverage,
  };
}
