import type { TransactionRecord } from "../types/TransactionRecord";
import type { Debt } from "../debt/Debt";
import type { Goal } from "../goals/Goal";
import type { Investment } from "../investments/Investment";
import type { AggregatePeriod } from "./AggregatePeriod";
import type { AggregateFilters } from "./AggregateFilters";
import type { AccountSummary } from "./AccountSummary";
import type { BudgetRecord } from "./BudgetRecord";
import type { RecurringPayment } from "./RecurringPayment";
import type { IncomeAggregate } from "./IncomeAggregate";
import type { ExpenseAggregate } from "./ExpenseAggregate";
import type { CategoryAggregate } from "./CategoryAggregate";

/**
 * Immutable aggregate of all financial data for a user within a period.
 *
 * This is the single source of truth for all downstream layers:
 * metrics, analytics, insights, and recommendations MUST read from
 * a FinancialAggregate — never from repositories directly.
 *
 * Invariants:
 *   - All fields are deeply readonly (no downstream mutation)
 *   - transactions is the complete filtered set; income/expenses/categoryBreakdown
 *     are organized views over the same set — no duplication of Money values
 *   - accounts is derived from the transaction stream, not from a dedicated model
 *
 * @see IFinancialAggregator — how to obtain a FinancialAggregate
 * @see FinancialAggregateBuilder — how to construct one in tests
 */
export interface FinancialAggregate {
  readonly userId: string;
  readonly period: AggregatePeriod;
  readonly filters: AggregateFilters;
  /** Timestamp when this aggregate was built — use for cache invalidation */
  readonly aggregatedAt: Date;

  // ── Full transaction set ─────────────────────────────────────────────
  /** All transactions matching the filter criteria, ordered by date ascending */
  readonly transactions: ReadonlyArray<TransactionRecord>;

  // ── Organized transaction views ──────────────────────────────────────
  /** Credit/income transactions, split into salary vs. other */
  readonly income: IncomeAggregate;
  /** Debit/expense transactions, split by category and recurrence */
  readonly expenses: ExpenseAggregate;
  /** All transactions grouped by category (covers both credits and debits) */
  readonly categoryBreakdown: ReadonlyArray<CategoryAggregate>;

  // ── Derived account data ─────────────────────────────────────────────
  /** Bank and card accounts inferred from the transaction stream */
  readonly accounts: ReadonlyArray<AccountSummary>;

  // ── Domain entity snapshots ──────────────────────────────────────────
  /** Active debt instruments at aggregate time */
  readonly debts: ReadonlyArray<Debt>;
  /** All goals at aggregate time */
  readonly goals: ReadonlyArray<Goal>;
  /** Active investment holdings at aggregate time */
  readonly investments: ReadonlyArray<Investment>;
  /** Active budget entries for the period */
  readonly budgets: ReadonlyArray<BudgetRecord>;
  /** Active recurring payments and subscriptions */
  readonly recurringPayments: ReadonlyArray<RecurringPayment>;
}
