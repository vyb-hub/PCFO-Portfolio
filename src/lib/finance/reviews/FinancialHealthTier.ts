/**
 * Tiered classification of overall financial health.
 *
 * Derived from the fraction of MetricEvaluation objects that are healthy:
 *   EXCELLENT       — >= 85% healthy
 *   GOOD            — >= 70%
 *   FAIR            — >= 50%
 *   NEEDS_ATTENTION — >= 30%
 *   CRITICAL        — < 30%
 */
export enum FinancialHealthTier {
  EXCELLENT       = "EXCELLENT",
  GOOD            = "GOOD",
  FAIR            = "FAIR",
  NEEDS_ATTENTION = "NEEDS_ATTENTION",
  CRITICAL        = "CRITICAL",
}
