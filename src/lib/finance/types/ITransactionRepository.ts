import type { DateRange } from "./DateRange";
import type { TransactionRecord } from "./TransactionRecord";

/**
 * Port: the finance layer's read-only access to transaction data.
 *
 * Implementations live in the infrastructure layer (e.g., PrismaTransactionRepository).
 * All domain services depend on this interface, keeping the finance layer
 * free from any database or ORM coupling.
 */
export interface ITransactionRepository {
  /** All transactions for the user within the period. */
  findByPeriod(userId: string, period: DateRange): Promise<readonly TransactionRecord[]>;

  /** Transactions in a specific category, optionally filtered by period. */
  findByCategory(
    userId: string,
    category: string,
    period?: DateRange,
  ): Promise<readonly TransactionRecord[]>;

  /** All recurring transactions for the user. */
  findRecurring(userId: string): Promise<readonly TransactionRecord[]>;

  /** The N most recent transactions for the user. */
  findRecent(userId: string, limit: number): Promise<readonly TransactionRecord[]>;
}
