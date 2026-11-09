import type { FinancialSnapshot } from "../analytics/FinancialSnapshot";
import type { Money } from "../types/Money";

/**
 * The type of hypothetical change to simulate.
 */
export enum WhatIfScenarioType {
  EXTRA_DEBT_PAYMENT = "EXTRA_DEBT_PAYMENT",
  EXPENSE_REDUCTION = "EXPENSE_REDUCTION",
  INCOME_INCREASE = "INCOME_INCREASE",
  INVESTMENT_REALLOCATION = "INVESTMENT_REALLOCATION",
  GOAL_ACCELERATION = "GOAL_ACCELERATION",
  SUBSCRIPTION_CANCELLATION = "SUBSCRIPTION_CANCELLATION",
}

/**
 * Parameters describing the hypothetical change to model.
 * `parameters` is intentionally open-ended — each ScenarioType
 * defines its own parameter shape at the implementation layer.
 */
export interface WhatIfScenario {
  readonly type: WhatIfScenarioType;
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Human-readable description of what's being simulated. */
  readonly description: string;
}

/**
 * The outcome of simulating a WhatIfScenario against a baseline snapshot.
 * Both snapshots are immutable value objects.
 */
export interface WhatIfResult {
  readonly scenario: WhatIfScenario;
  readonly baselineSnapshot: FinancialSnapshot;
  readonly projectedSnapshot: FinancialSnapshot;
  readonly deltaNetWorth: Money;
  /** Positive = faster payoff, negative = slower, null = no debt. */
  readonly deltaMonthsToDebtFreedom: number | null;
  readonly computedAt: Date;
}

/**
 * Contract for the What-If simulation engine.
 *
 * The engine accepts a baseline FinancialSnapshot and a hypothetical change,
 * then projects a new FinancialSnapshot to show the user the outcome.
 * No real data is modified — all results are projections.
 *
 * @future Milestone 3+
 */
export interface IWhatIfEngine {
  /**
   * Simulate a hypothetical scenario against the user's current financial state.
   * Returns both the baseline and projected snapshots for comparison.
   */
  simulate(userId: string, scenario: WhatIfScenario): Promise<WhatIfResult>;

  /**
   * Run multiple scenarios and return results ordered by delta net worth impact.
   */
  compareScenarios(userId: string, scenarios: readonly WhatIfScenario[]): Promise<readonly WhatIfResult[]>;
}
