/**
 * The financial domain category an insight belongs to.
 *
 * Used for grouping, filtering, and routing insights to the
 * appropriate section of the UI or AI Coach narrative.
 */
export enum InsightCategory {
  BEHAVIOUR  = "BEHAVIOUR",
  SPENDING   = "SPENDING",
  SAVINGS    = "SAVINGS",
  DEBT       = "DEBT",
  INVESTMENT = "INVESTMENT",
  GOALS      = "GOALS",
  RISK       = "RISK",
  OPPORTUNITY = "OPPORTUNITY",
  CASH_FLOW  = "CASH_FLOW",
}
