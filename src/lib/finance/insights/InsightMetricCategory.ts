/**
 * Financial domain category for insights produced by the Insight Generation Engine.
 *
 * Categories correspond directly to MetricType domains, enabling insight
 * consumers to group by financial area without knowledge of specific metrics.
 *
 * Distinct from the legacy InsightCategory enum used by the analytics-pipeline system.
 */
export enum InsightMetricCategory {
  SAVINGS            = "SAVINGS",
  DEBT               = "DEBT",
  CASH_FLOW          = "CASH_FLOW",
  SPENDING           = "SPENDING",
  INCOME             = "INCOME",
  INVESTMENTS        = "INVESTMENTS",
  EMERGENCY_FUND     = "EMERGENCY_FUND",
  GOALS              = "GOALS",
  CREDIT_UTILISATION = "CREDIT_UTILISATION",
  DEBT_TO_INCOME     = "DEBT_TO_INCOME",
  NET_WORTH          = "NET_WORTH",
}
