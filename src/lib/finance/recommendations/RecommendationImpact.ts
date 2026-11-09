import type { Money } from "../types/Money";

/**
 * The dimension of life this recommendation improves.
 */
export enum ImpactDimension {
  FINANCIAL = "FINANCIAL",
  BEHAVIOURAL = "BEHAVIOURAL",
  RISK = "RISK",
  GOAL_PROGRESS = "GOAL_PROGRESS",
}

/**
 * A typed, measurable description of the benefit if this recommendation is acted on.
 *
 * Separating impact into dimensions allows the AI Coach to explain trade-offs
 * clearly: a debt payoff recommendation might be FINANCIAL and RISK, while a
 * subscription cancellation is FINANCIAL and BEHAVIOURAL.
 */
export interface RecommendationImpact {
  readonly dimension: ImpactDimension;
  /** Plain-English description of the expected improvement. */
  readonly description: string;
  /** Estimated monetary value of the impact, if quantifiable. */
  readonly estimatedValue: Money | null;
  /**
   * For non-monetary dimensions (behavioural, risk), a 0–100 score
   * representing the expected improvement magnitude.
   */
  readonly impactScore: number | null;
}
