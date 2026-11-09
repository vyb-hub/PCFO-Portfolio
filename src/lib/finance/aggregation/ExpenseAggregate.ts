import type { TransactionRecord } from "../types/TransactionRecord";
import type { CategoryAggregate } from "./CategoryAggregate";

/** Organized view of all debit/expense transactions within the aggregate period. */
export interface ExpenseAggregate {
  /** All DEBIT transactions (TRANSFER excluded — money movement between own accounts is not an expense) */
  readonly all: ReadonlyArray<TransactionRecord>;
  /** Expenses grouped by category */
  readonly byCategory: ReadonlyArray<CategoryAggregate>;
  /** Recurring expense transactions (isRecurring === true) */
  readonly recurring: ReadonlyArray<TransactionRecord>;
  /** Non-recurring / one-off expense transactions */
  readonly nonRecurring: ReadonlyArray<TransactionRecord>;
}
