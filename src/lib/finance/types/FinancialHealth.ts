/**
 * A holistic score (0–100) representing the user's financial wellbeing,
 * broken into domain sub-scores.
 */
export interface FinancialHealthScore {
  /** Composite 0–100 score */
  readonly overall: number;
  /** How easily the user can cover 3–6 months of expenses */
  readonly liquidity: number;
  /** Debt burden relative to income (inverted — higher is better) */
  readonly debt: number;
  /** Savings rate and adequacy */
  readonly savings: number;
  /** Spending discipline vs budget/income */
  readonly spending: number;
  /** ISO timestamp of when this score was computed */
  readonly computedAt: string;
}
