import type { TransactionRecord } from "../types/TransactionRecord";

/** All transactions belonging to a single spending category. */
export interface CategoryAggregate {
  readonly category: string;
  readonly transactionCount: number;
  readonly transactions: ReadonlyArray<TransactionRecord>;
}
