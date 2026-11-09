import type { TransactionRecordType } from "../types/TransactionRecord";
import type { AggregatePeriod } from "./AggregatePeriod";

/**
 * Filtering parameters applied when building a FinancialAggregate.
 * All filters are optional — omitting them returns all data for the user and period.
 */
export interface AggregateFilters {
  readonly userId: string;
  readonly period?: AggregatePeriod;
  /** When set, only transactions from these accounts are included */
  readonly accountIds?: ReadonlyArray<string>;
  /** When set, only transactions in these categories are included */
  readonly categories?: ReadonlyArray<string>;
  /** When set, only transactions of these types are included */
  readonly transactionTypes?: ReadonlyArray<TransactionRecordType>;
}
