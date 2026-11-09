import type { ITransactionRepository } from "../types/ITransactionRepository";
import type { IDebtRepository } from "../debt/IDebtRepository";
import type { IGoalRepository } from "../goals/IGoalRepository";
import type { IInvestmentRepository } from "../investments/IInvestmentRepository";
import { DateUtils } from "../utils/DateUtils";
import type { IBudgetRepository } from "./IBudgetRepository";
import type { IRecurringPaymentRepository } from "./IRecurringPaymentRepository";
import type { IFinancialAggregator } from "./IFinancialAggregator";
import type { FinancialAggregate } from "./FinancialAggregate";
import type { AggregateSummary } from "./AggregateSummary";
import type { AggregatePeriod } from "./AggregatePeriod";
import { AggregateGranularity } from "./AggregatePeriod";
import type { AggregateFilters } from "./AggregateFilters";
import { FinancialAggregateBuilder } from "./FinancialAggregateBuilder";

/**
 * Concrete implementation of IFinancialAggregator.
 *
 * Responsibilities:
 *   - Fetch raw data from repository interfaces (no Prisma, no SQL)
 *   - Delegate all data organization to FinancialAggregateBuilder
 *   - Return immutable FinancialAggregate objects to callers
 *
 * Not responsible for:
 *   - Any financial calculations (those belong in the metrics layer)
 *   - Caching (add a caching decorator in the infrastructure layer)
 *   - Authentication (enforce at the API route layer)
 */
export class FinancialAggregator implements IFinancialAggregator {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly debtRepo: IDebtRepository,
    private readonly goalRepo: IGoalRepository,
    private readonly investmentRepo: IInvestmentRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly recurringRepo: IRecurringPaymentRepository,
  ) {}

  async getAggregate(
    userId: string,
    period: AggregatePeriod,
    filters?: AggregateFilters,
  ): Promise<FinancialAggregate> {
    const effectiveFilters: AggregateFilters = { userId, period, ...filters };

    const [transactions, debts, goals, investments, budgets, recurringPayments] =
      await Promise.all([
        this.transactionRepo.findByPeriod(userId, period.range),
        this.debtRepo.findActive(userId),
        this.goalRepo.findActive(userId),
        this.investmentRepo.findActive(userId),
        this.budgetRepo.findActive(userId),
        this.recurringRepo.findActive(userId),
      ]);

    return new FinancialAggregateBuilder()
      .forUser(userId)
      .forPeriod(period)
      .withFilters(effectiveFilters)
      .withTransactions(transactions)
      .withDebts(debts)
      .withGoals(goals)
      .withInvestments(investments)
      .withBudgets(budgets)
      .withRecurringPayments(recurringPayments)
      .build();
  }

  async getCurrentFinancialState(userId: string): Promise<FinancialAggregate> {
    const range = DateUtils.monthOf(new Date());
    const period: AggregatePeriod = {
      range,
      label: DateUtils.monthLabel(range.start),
      granularity: AggregateGranularity.MONTHLY,
    };
    return this.getAggregate(userId, period);
  }

  async getDebtContext(userId: string): Promise<FinancialAggregate> {
    const range = DateUtils.monthOf(new Date());
    const period: AggregatePeriod = {
      range,
      label: DateUtils.monthLabel(range.start),
      granularity: AggregateGranularity.MONTHLY,
    };
    const [debts, goals] = await Promise.all([
      this.debtRepo.findActive(userId),
      this.goalRepo.findActive(userId),
    ]);
    return new FinancialAggregateBuilder()
      .forUser(userId)
      .forPeriod(period)
      .withDebts(debts)
      .withGoals(goals)
      .build();
  }

  async getGoalContext(userId: string): Promise<FinancialAggregate> {
    const range = DateUtils.monthOf(new Date());
    const period: AggregatePeriod = {
      range,
      label: DateUtils.monthLabel(range.start),
      granularity: AggregateGranularity.MONTHLY,
    };
    const goals = await this.goalRepo.findActive(userId);
    return new FinancialAggregateBuilder()
      .forUser(userId)
      .forPeriod(period)
      .withGoals(goals)
      .build();
  }

  async getInvestmentContext(userId: string): Promise<FinancialAggregate> {
    const range = DateUtils.monthOf(new Date());
    const period: AggregatePeriod = {
      range,
      label: DateUtils.monthLabel(range.start),
      granularity: AggregateGranularity.MONTHLY,
    };
    const investments = await this.investmentRepo.findActive(userId);
    return new FinancialAggregateBuilder()
      .forUser(userId)
      .forPeriod(period)
      .withInvestments(investments)
      .build();
  }

  async getSummary(userId: string, period: AggregatePeriod): Promise<AggregateSummary> {
    const filters: AggregateFilters = { userId, period };
    const [transactions, debts, goals, investments, recurringPayments] = await Promise.all([
      this.transactionRepo.findByPeriod(userId, period.range),
      this.debtRepo.findActive(userId),
      this.goalRepo.findActive(userId),
      this.investmentRepo.findActive(userId),
      this.recurringRepo.findActive(userId),
    ]);
    return new FinancialAggregateBuilder()
      .forUser(userId)
      .forPeriod(period)
      .withFilters(filters)
      .withTransactions(transactions)
      .withDebts(debts)
      .withGoals(goals)
      .withInvestments(investments)
      .withRecurringPayments(recurringPayments)
      .buildSummary();
  }
}
