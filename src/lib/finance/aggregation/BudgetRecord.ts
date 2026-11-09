import type { Money } from "../types/Money";
import type { AggregatePeriod } from "./AggregatePeriod";

/**
 * Finance domain's view of a budget entry.
 * A budget is a spending limit set for a category within a given period.
 *
 * Future milestone: a dedicated budgets/ domain module will own this type.
 */
export interface BudgetRecord {
  readonly id: string;
  readonly userId: string;
  readonly category: string;
  readonly budgetedAmount: Money;
  readonly period: AggregatePeriod;
  readonly isActive: boolean;
  readonly createdAt: Date;
}
