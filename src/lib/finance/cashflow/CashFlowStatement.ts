import type { Money } from "../types/Money";
import type { DateRange } from "../types/DateRange";
import type { CashFlow } from "./CashFlow";

/**
 * A formal period cash flow statement, similar to an accounting statement.
 */
export interface CashFlowStatement {
  readonly userId: string;
  readonly period: DateRange;
  readonly cashFlow: CashFlow;
  /** Opening balance at the start of the period */
  readonly openingBalance: Money;
  /** Closing balance at end of the period */
  readonly closingBalance: Money;
  /** ISO timestamp when this statement was generated */
  readonly generatedAt: string;
}
