/**
 * The kind of analytical observation a finding represents.
 *
 * Multiple analyzers may produce findings of the same type.
 * Consumers can use this to filter findings by category of analysis.
 */
export enum AnalysisFindingType {
  TREND        = "TREND",        // directional change over time
  VARIANCE     = "VARIANCE",     // volatility or inconsistency
  SEASONALITY  = "SEASONALITY",  // recurring period pattern
  BEHAVIOUR    = "BEHAVIOUR",    // spending or financial behaviour pattern
  GOAL_PROGRESS = "GOAL_PROGRESS", // wealth growth or goal trajectory
  RISK         = "RISK",         // deteriorating or threshold-approaching metric
  STABILITY    = "STABILITY",    // consistent, low-volatility observation
}
