import type { TransactionRecord } from "../types/TransactionRecord";
import type { Debt } from "../debt/Debt";
import { DebtStatus } from "../debt/Debt";
import type { Goal } from "../goals/Goal";
import { GoalStatus } from "../goals/Goal";
import type { Investment } from "../investments/Investment";
import { InvestmentStatus } from "../investments/Investment";
import { MoneyUtils } from "../utils/MoneyUtils";
import type { AggregatePeriod } from "./AggregatePeriod";
import type { AggregateFilters } from "./AggregateFilters";
import type { AccountSummary } from "./AccountSummary";
import type { BudgetRecord } from "./BudgetRecord";
import type { RecurringPayment } from "./RecurringPayment";
import type { FinancialAggregate } from "./FinancialAggregate";
import type { AggregateSummary } from "./AggregateSummary";
import type { CategoryAggregate } from "./CategoryAggregate";
import type { IncomeAggregate } from "./IncomeAggregate";
import type { ExpenseAggregate } from "./ExpenseAggregate";

/**
 * Builder for FinancialAggregate.
 *
 * Accumulates raw domain data, then organizes it into the immutable
 * FinancialAggregate on build(). The builder is the only place where
 * data organization logic lives:
 *   - filtering transactions by account, category, and type
 *   - splitting transactions into income / expenses
 *   - identifying salary credits (category "salary")
 *   - grouping expenses by category
 *   - deriving AccountSummary from the transaction stream
 *
 * No financial calculations are performed here — no averages, ratios,
 * or aggregated Money arithmetic (except simple totals in buildSummary).
 */
export class FinancialAggregateBuilder {
  private _userId: string = "";
  private _period: AggregatePeriod | null = null;
  private _filters: AggregateFilters | null = null;
  private _transactions: TransactionRecord[] = [];
  private _debts: Debt[] = [];
  private _goals: Goal[] = [];
  private _investments: Investment[] = [];
  private _budgets: BudgetRecord[] = [];
  private _recurringPayments: RecurringPayment[] = [];

  forUser(userId: string): this {
    this._userId = userId;
    return this;
  }

  forPeriod(period: AggregatePeriod): this {
    this._period = period;
    return this;
  }

  withFilters(filters: AggregateFilters): this {
    this._filters = filters;
    return this;
  }

  withTransactions(transactions: readonly TransactionRecord[]): this {
    this._transactions = [...transactions];
    return this;
  }

  withDebts(debts: readonly Debt[]): this {
    this._debts = [...debts];
    return this;
  }

  withGoals(goals: readonly Goal[]): this {
    this._goals = [...goals];
    return this;
  }

  withInvestments(investments: readonly Investment[]): this {
    this._investments = [...investments];
    return this;
  }

  withBudgets(budgets: readonly BudgetRecord[]): this {
    this._budgets = [...budgets];
    return this;
  }

  withRecurringPayments(recurringPayments: readonly RecurringPayment[]): this {
    this._recurringPayments = [...recurringPayments];
    return this;
  }

  /** Builds the full immutable FinancialAggregate. */
  build(): FinancialAggregate {
    if (!this._userId) throw new Error("FinancialAggregateBuilder: userId is required");
    if (!this._period) throw new Error("FinancialAggregateBuilder: period is required");

    const effectiveFilters: AggregateFilters = this._filters ?? {
      userId: this._userId,
      period: this._period,
    };

    const filtered = this._applyFilters(this._transactions, effectiveFilters);
    const income = this._buildIncome(filtered);
    const expenses = this._buildExpenses(filtered);
    const categoryBreakdown = this._buildCategoryBreakdown(filtered);
    const accounts = this._deriveAccounts(filtered);

    return {
      userId: this._userId,
      period: this._period,
      filters: effectiveFilters,
      aggregatedAt: new Date(),
      transactions: filtered,
      income,
      expenses,
      categoryBreakdown,
      accounts,
      debts: this._debts,
      goals: this._goals,
      investments: this._investments,
      budgets: this._budgets,
      recurringPayments: this._recurringPayments,
    };
  }

  /**
   * Builds a lightweight AggregateSummary instead of the full aggregate.
   * Uses MoneyUtils.sum to total credits and debits — the only arithmetic here.
   */
  buildSummary(): AggregateSummary {
    if (!this._userId) throw new Error("FinancialAggregateBuilder: userId is required");
    if (!this._period) throw new Error("FinancialAggregateBuilder: period is required");

    const effectiveFilters: AggregateFilters = this._filters ?? {
      userId: this._userId,
      period: this._period,
    };
    const filtered = this._applyFilters(this._transactions, effectiveFilters);

    const credits = filtered.filter((t) => t.type === "CREDIT");
    const debits = filtered.filter((t) => t.type === "DEBIT");
    const uniqueAccounts = new Set(filtered.map((t) => t.account).filter(Boolean));

    const activeGoalStatuses: GoalStatus[] = [
      GoalStatus.IN_PROGRESS,
      GoalStatus.ON_TRACK,
      GoalStatus.AT_RISK,
    ];

    return {
      userId: this._userId,
      period: this._period,
      transactionCount: filtered.length,
      totalCredits: MoneyUtils.sum(credits.map((t) => t.amount)),
      totalDebits: MoneyUtils.sum(debits.map((t) => t.amount)),
      activeDebtCount: this._debts.filter((d) => d.status === DebtStatus.ACTIVE).length,
      activeGoalCount: this._goals.filter((g) => activeGoalStatuses.includes(g.status)).length,
      activeInvestmentCount: this._investments.filter(
        (i) => i.status === InvestmentStatus.ACTIVE,
      ).length,
      recurringPaymentCount: this._recurringPayments.filter((r) => r.isActive).length,
      accountCount: uniqueAccounts.size,
      computedAt: new Date(),
    };
  }

  private _applyFilters(
    transactions: readonly TransactionRecord[],
    filters: AggregateFilters,
  ): readonly TransactionRecord[] {
    return transactions.filter((txn) => {
      if (filters.accountIds && filters.accountIds.length > 0) {
        if (!txn.account || !filters.accountIds.includes(txn.account)) return false;
      }
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(txn.category)) return false;
      }
      if (filters.transactionTypes && filters.transactionTypes.length > 0) {
        if (!filters.transactionTypes.includes(txn.type)) return false;
      }
      return true;
    });
  }

  private _buildIncome(transactions: readonly TransactionRecord[]): IncomeAggregate {
    const all = transactions.filter((t) => t.type === "CREDIT");
    const salaryCredits = all.filter((t) => t.category.toLowerCase() === "salary");
    const otherCredits = all.filter((t) => t.category.toLowerCase() !== "salary");
    return { all, salaryCredits, otherCredits };
  }

  private _buildExpenses(transactions: readonly TransactionRecord[]): ExpenseAggregate {
    const all = transactions.filter((t) => t.type === "DEBIT");
    const recurring = all.filter((t) => t.isRecurring);
    const nonRecurring = all.filter((t) => !t.isRecurring);
    const byCategory = this._buildCategoryBreakdown(all);
    return { all, byCategory, recurring, nonRecurring };
  }

  private _buildCategoryBreakdown(
    transactions: readonly TransactionRecord[],
  ): ReadonlyArray<CategoryAggregate> {
    const map = new Map<string, TransactionRecord[]>();
    for (const txn of transactions) {
      const bucket = map.get(txn.category) ?? [];
      bucket.push(txn);
      map.set(txn.category, bucket);
    }
    return Array.from(map.entries()).map(([category, txns]) => ({
      category,
      transactionCount: txns.length,
      transactions: txns,
    }));
  }

  private _deriveAccounts(
    transactions: readonly TransactionRecord[],
  ): ReadonlyArray<AccountSummary> {
    const map = new Map<string, TransactionRecord[]>();
    for (const txn of transactions) {
      if (!txn.account) continue;
      const bucket = map.get(txn.account) ?? [];
      bucket.push(txn);
      map.set(txn.account, bucket);
    }
    return Array.from(map.entries()).map(([accountIdentifier, txns]) => {
      const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());
      return {
        accountIdentifier,
        accountLast4: null,
        transactionCount: txns.length,
        firstSeenAt: sorted[0]!.date,
        lastSeenAt: sorted[sorted.length - 1]!.date,
      };
    });
  }
}
