import { RecommendationRegistry } from "../RecommendationRegistry";
import { RecommendationEngine } from "../RecommendationEngine";
import type { IRecommendationEngine } from "../IRecommendationEngine";
import { DebtRecommendationGenerator } from "./DebtRecommendationGenerator";
import { SavingsRecommendationGenerator } from "./SavingsRecommendationGenerator";
import { InvestmentRecommendationGenerator } from "./InvestmentRecommendationGenerator";
import { CashFlowRecommendationGenerator } from "./CashFlowRecommendationGenerator";
import { GoalRecommendationGenerator } from "./GoalRecommendationGenerator";
import { LifestyleRecommendationGenerator } from "./LifestyleRecommendationGenerator";
import { RiskMitigationRecommendationGenerator } from "./RiskMitigationRecommendationGenerator";

export { DebtRecommendationGenerator } from "./DebtRecommendationGenerator";
export { SavingsRecommendationGenerator } from "./SavingsRecommendationGenerator";
export { InvestmentRecommendationGenerator } from "./InvestmentRecommendationGenerator";
export { CashFlowRecommendationGenerator } from "./CashFlowRecommendationGenerator";
export { GoalRecommendationGenerator } from "./GoalRecommendationGenerator";
export { LifestyleRecommendationGenerator } from "./LifestyleRecommendationGenerator";
export { RiskMitigationRecommendationGenerator } from "./RiskMitigationRecommendationGenerator";

/**
 * Factory that wires all default RecommendationGenerators into a ready-to-use
 * RecommendationEngine.
 *
 * This is the only place in the codebase where concrete generator names appear.
 * RecommendationEngine and RecommendationRegistry are generator-agnostic.
 *
 * To add a new generator:
 *   1. Create MyRecommendationGenerator implementing RecommendationGenerator
 *   2. Add .register(new MyRecommendationGenerator()) below
 */
export function createDefaultRecommendationEngine(): IRecommendationEngine {
  const registry = new RecommendationRegistry()
    .register(new DebtRecommendationGenerator())
    .register(new SavingsRecommendationGenerator())
    .register(new InvestmentRecommendationGenerator())
    .register(new CashFlowRecommendationGenerator())
    .register(new GoalRecommendationGenerator())
    .register(new LifestyleRecommendationGenerator())
    .register(new RiskMitigationRecommendationGenerator());

  return new RecommendationEngine(registry);
}
