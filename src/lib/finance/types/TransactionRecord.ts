import type { Money } from "./Money";

/**
 * The finance domain's view of a transaction.
 *
 * This is the adapter boundary between the ingestion layer (Prisma Transaction model)
 * and the Financial Intelligence Layer. All domain services depend on this type,
 * never on the raw database model.
 */
export interface TransactionRecord {
  readonly id: string;
  readonly userId: string;
  readonly amount: Money;
  readonly type: TransactionRecordType;
  readonly category: string;
  readonly subcategory: string | null;
  readonly description: string;
  readonly merchant: string | null;
  readonly account: string | null;
  readonly date: Date;
  readonly isRecurring: boolean;
  readonly recurringId: string | null;
}

export type TransactionRecordType = "DEBIT" | "CREDIT" | "TRANSFER" | "REFUND";
