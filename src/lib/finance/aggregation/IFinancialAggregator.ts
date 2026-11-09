import type { FinancialAggregate } from "./FinancialAggregate";
import type { AggregateSummary } from "./AggregateSummary";
import type { AggregatePeriod } from "./AggregatePeriod";
import type { AggregateFilters } from "./AggregateFilters";

/**
 * Service contract for the Financial Data Aggregation Layer.
 *
 * The aggregator is the ONLY authorised entry point into financial data
 * for all downstream layers: metrics, analytics, insights, recommendations,
 * and the AI coach. No downstream service should access repositories directly.
 *
 * @depends-on ITransactionRepository, IDebtRepository, IGoalRepository,
 *             IInvestmentRepository, IBudgetRepository, IRecurringPaymentRepository
 */
export interface IFinancialAggregator {
  /**
   * Builds the complete FinancialAggregate for a user in a given period.
   * This is the primary method — all other methods are convenience wrappers.
   */
  getAggregate(
    userId: string,
    period: AggregatePeriod,
    filters?: AggregateFilters,
  ): Promise<FinancialAggregate>;

  /**
   * Returns the aggregate for the current calendar month.
   * Equivalent to getAggregate with period = current month, no extra filters.
   */
  getCurrentFinancialState(userId: string): Promise<FinancialAggregate>;

  /**
   * Returns an aggregate focused on active debts and goals.
   * Transactions are omitted — use for the debt management context.
   */
  getDebtContext(userId: string): Promise<FinancialAggregate>;

  /**
   * Returns an aggregate focused on active goals.
   * Use for the goal planning and tracking context.
   */
  getGoalContext(userId: string): Promise<FinancialAggregate>;

  /**
   * Returns an aggregate focused on active investment holdings.
   * Use for the portfolio analysis context.
   */
  getInvestmentContext(userId: string): Promise<FinancialAggregate>;

  /**
   * Returns a lightweight AggregateSummary for the given period.
   * Use for dashboard cards where the full transaction list is not required.
   */
  getSummary(userId: string, period: AggregatePeriod): Promise<AggregateSummary>;
}
