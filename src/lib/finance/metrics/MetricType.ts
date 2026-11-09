/**
 * Every measurable financial fact this system can compute.
 *
 * Metrics are atomic, period-scoped, unitless quantities.
 * They are the raw material that Analytics turns into patterns
 * and Insights turns into actionable observations.
 */
export enum MetricType {
  // Cash flow
  SAVINGS_RATE             = "SAVINGS_RATE",
  CASH_FLOW                = "CASH_FLOW",
  BURN_RATE                = "BURN_RATE",
  NET_CASH_FLOW            = "NET_CASH_FLOW",          // kept for backwards compatibility
  RECURRING_SPEND          = "RECURRING_SPEND",
  RECURRING_EXPENSES_RATIO = "RECURRING_EXPENSES_RATIO", // kept for backwards compatibility

  // Debt
  DEBT_TO_INCOME_RATIO  = "DEBT_TO_INCOME_RATIO",
  DEBT_RATIO            = "DEBT_RATIO",
  CREDIT_UTILIZATION    = "CREDIT_UTILIZATION",
  MONTHS_TO_DEBT_FREEDOM = "MONTHS_TO_DEBT_FREEDOM",

  // Wealth
  NET_WORTH        = "NET_WORTH",
  INVESTMENT_RATIO = "INVESTMENT_RATIO",
  LIQUIDITY_RATIO  = "LIQUIDITY_RATIO",

  // Safety
  EMERGENCY_FUND_COVERAGE = "EMERGENCY_FUND_COVERAGE",
}

/**
 * The unit in which a metric value is expressed.
 * Used by UI and formatting layers to render the value correctly.
 */
export enum MetricUnit {
  PERCENTAGE = "PERCENTAGE",
  RATIO = "RATIO",
  CURRENCY = "CURRENCY",
  MONTHS = "MONTHS",
  COUNT = "COUNT",
}

/**
 * How often a metric should be recalculated.
 * Used by the metrics scheduler (future milestone).
 */
export enum CalculationFrequency {
  REAL_TIME = "REAL_TIME",
  DAILY     = "DAILY",
  WEEKLY    = "WEEKLY",
  MONTHLY   = "MONTHLY",
  ON_DEMAND = "ON_DEMAND",
}

/**
 * Direction of change relative to the previous period.
 */
export enum MetricTrend {
  IMPROVING = "IMPROVING",
  STABLE = "STABLE",
  DECLINING = "DECLINING",
  UNKNOWN = "UNKNOWN",
}
