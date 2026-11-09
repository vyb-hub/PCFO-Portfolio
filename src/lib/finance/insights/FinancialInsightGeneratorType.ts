/**
 * Canonical identifier for each Insight Generation Engine generator.
 * Used as the registry key — one generator per type.
 */
export enum FinancialInsightGeneratorType {
  SAVINGS        = "SAVINGS",
  CASH_FLOW      = "CASH_FLOW",
  DEBT           = "DEBT",
  DEBT_TO_INCOME = "DEBT_TO_INCOME",
  CREDIT         = "CREDIT",
  SPENDING       = "SPENDING",
  INVESTMENTS    = "INVESTMENTS",
  EMERGENCY_FUND = "EMERGENCY_FUND",
  NET_WORTH      = "NET_WORTH",
  GOALS          = "GOALS",
}
