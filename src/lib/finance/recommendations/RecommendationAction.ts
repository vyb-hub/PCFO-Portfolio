/**
 * The structured action a recommendation asks the user to take.
 *
 * Actions are consumed by the AI Coach to build a narrative around the
 * recommendation and by the What-If Engine to model the impact of each action.
 *
 * Actions are intentionally broad — specific amounts, dates, and strategies
 * are the domain of the AI Coach, not the Recommendation Platform.
 */
export enum RecommendationAction {
  INCREASE_SAVINGS          = "INCREASE_SAVINGS",
  REDUCE_SPENDING           = "REDUCE_SPENDING",
  ACCELERATE_DEBT_REPAYMENT = "ACCELERATE_DEBT_REPAYMENT",
  DELAY_PURCHASE            = "DELAY_PURCHASE",
  INCREASE_INVESTMENT       = "INCREASE_INVESTMENT",
  BUILD_EMERGENCY_FUND      = "BUILD_EMERGENCY_FUND",
  REDUCE_RECURRING_COSTS    = "REDUCE_RECURRING_COSTS",
  CONSOLIDATE_DEBT          = "CONSOLIDATE_DEBT",
  CREATE_BUDGET             = "CREATE_BUDGET",
  REBALANCE_PORTFOLIO       = "REBALANCE_PORTFOLIO",
  REVIEW_INSURANCE          = "REVIEW_INSURANCE",
}
