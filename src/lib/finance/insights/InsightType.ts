/**
 * The nature of a FinancialInsight produced by the Insight Generation Engine.
 *
 * POSITIVE    — metric is healthy and trending in a good direction.
 * WARNING     — metric is healthy but deteriorating, or approaching an unhealthy range.
 * RISK        — metric is outside its healthy range.
 * OPPORTUNITY — a gap between current state and potential improvement has been identified.
 * NEUTRAL     — metric is stable within an acceptable range; no action needed.
 * MILESTONE   — metric has just crossed a significant threshold (e.g. emergency fund fully funded).
 */
export enum InsightType {
  POSITIVE    = "POSITIVE",
  WARNING     = "WARNING",
  RISK        = "RISK",
  OPPORTUNITY = "OPPORTUNITY",
  NEUTRAL     = "NEUTRAL",
  MILESTONE   = "MILESTONE",
}
