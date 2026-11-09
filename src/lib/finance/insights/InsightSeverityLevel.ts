/**
 * Severity level for insights produced by the Insight Generation Engine.
 *
 * Distinct from the legacy InsightSeverity enum (CRITICAL / WARNING / INFO)
 * used by the analytics-pipeline insight system.
 *
 * LOW      — informational; no action required.
 * MEDIUM   — worth monitoring; minor adjustment may help.
 * HIGH     — needs attention; metric outside healthy range or declining.
 * CRITICAL — requires immediate action; significant financial risk.
 */
export enum InsightSeverityLevel {
  LOW      = "LOW",
  MEDIUM   = "MEDIUM",
  HIGH     = "HIGH",
  CRITICAL = "CRITICAL",
}
