/**
 * Unique identifier for each registered AnalyticsAnalyzer.
 *
 * Analogous to MetricType — each analyzer declares one of these values
 * in its AnalyzerDefinition.id so the AnalyticsRegistry can key off it.
 */
export enum AnalyzerType {
  TREND       = "TREND",
  VARIANCE    = "VARIANCE",
  SEASONALITY = "SEASONALITY",
  BEHAVIOUR   = "BEHAVIOUR",
  GOAL_PROGRESS = "GOAL_PROGRESS",
  RISK        = "RISK",
}
