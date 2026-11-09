import type { Money } from "../types/Money";
import type { DateRange } from "../types/DateRange";
import type { Frequency } from "../types/Frequency";

/** A single income source within a cash flow period */
export interface IncomeSource {
  readonly id: string;
  readonly name: string;
  readonly amount: Money;
  readonly frequency: Frequency;
  /** e.g. "SALARY", "FREELANCE", "DIVIDEND", "RENTAL" */
  readonly category: string;
}

/** A single expense category within a cash flow period */
export interface ExpenseCategory {
  readonly id: string;
  readonly name: string;
  /** e.g. "FOOD", "TRANSPORT", "HOUSING", "ENTERTAINMENT" */
  readonly category: string;
  readonly amount: Money;
  readonly transactionCount: number;
}

/**
 * Domain model representing the cash flows for a given period.
 */
export interface CashFlow {
  readonly period: DateRange;
  readonly incomeSources: readonly IncomeSource[];
  readonly expenseCategories: readonly ExpenseCategory[];
  readonly totalIncome: Money;
  readonly totalExpenses: Money;
  readonly netFlow: Money;
  readonly savingsRate: number; // 0–1
}
