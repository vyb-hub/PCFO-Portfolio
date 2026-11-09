/**
 * How urgently the user should attend to an insight.
 *
 * CRITICAL  — metric is breaching a threshold or a meaningful negative pattern
 *             is confirmed. Requires attention now.
 * WARNING   — metric is approaching a threshold or a deteriorating trend is
 *             detected with sufficient confidence.
 * INFO      — a positive development, a stable pattern, or a useful observation
 *             that requires no immediate action.
 */
export enum InsightSeverity {
  CRITICAL = "CRITICAL",
  WARNING  = "WARNING",
  INFO     = "INFO",
}
