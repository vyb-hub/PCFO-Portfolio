/**
 * Aggregate statistics and narrative for a FinancialInsightSnapshot.
 */
export interface FinancialInsightSummary {
  readonly totalInsights: number;
  readonly positiveInsights: number;
  readonly warnings: number;
  readonly risks: number;
  readonly criticalIssues: number;
  readonly opportunities: number;
  readonly milestones: number;
  /** One or two sentences describing the overall financial health picture. */
  readonly overallFinancialHealthNarrative: string;
}
