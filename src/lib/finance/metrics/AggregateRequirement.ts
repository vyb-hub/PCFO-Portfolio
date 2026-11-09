/**
 * Declares which sections of a FinancialAggregate a calculator accesses.
 *
 * Used for:
 *   - Documentation and discovery
 *   - Future optimisation (partial aggregate loading)
 *   - Test setup (know exactly what data to provide)
 */
export enum AggregateRequirement {
  TRANSACTIONS        = "TRANSACTIONS",
  INCOME              = "INCOME",
  EXPENSES            = "EXPENSES",
  DEBTS               = "DEBTS",
  GOALS               = "GOALS",
  INVESTMENTS         = "INVESTMENTS",
  BUDGETS             = "BUDGETS",
  RECURRING_PAYMENTS  = "RECURRING_PAYMENTS",
  ACCOUNTS            = "ACCOUNTS",
}
