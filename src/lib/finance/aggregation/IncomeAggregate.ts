import type { TransactionRecord } from "../types/TransactionRecord";

/** Organized view of all credit/income transactions within the aggregate period. */
export interface IncomeAggregate {
  /** All CREDIT transactions */
  readonly all: ReadonlyArray<TransactionRecord>;
  /** Payroll/salary credits (category === "salary") */
  readonly salaryCredits: ReadonlyArray<TransactionRecord>;
  /** All other credits: interest, refunds, transfers in, freelance, etc. */
  readonly otherCredits: ReadonlyArray<TransactionRecord>;
}
