/**
 * The financial domain a FinancialStory belongs to.
 *
 * Every category from the EC-011 charter is declared up front so the type
 * system is ready for future generators, even though only CASH_FLOW has a
 * registered generator this milestone.
 */
export enum StoryCategory {
  CASH_FLOW = "CASH_FLOW",
  SAVINGS = "SAVINGS",
  DEBT = "DEBT",
  SPENDING = "SPENDING",
  INCOME = "INCOME",
  INVESTMENTS = "INVESTMENTS",
  GOALS = "GOALS",
  FINANCIAL_HEALTH = "FINANCIAL_HEALTH",
  RISK = "RISK",
  OPPORTUNITIES = "OPPORTUNITIES",
  BEHAVIOUR = "BEHAVIOUR",
  ANOMALIES = "ANOMALIES",
  RECURRING_PAYMENTS = "RECURRING_PAYMENTS",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
  MONTHLY_HIGHLIGHTS = "MONTHLY_HIGHLIGHTS",
  MONTHLY_LOWLIGHTS = "MONTHLY_LOWLIGHTS",
}
