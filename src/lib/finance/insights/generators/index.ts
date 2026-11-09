import { InsightRegistry } from "../InsightRegistry";
import { InsightEngine } from "../InsightEngine";
import type { IInsightEngine } from "../IInsightEngine";
import { TrendInsightGenerator } from "./TrendInsightGenerator";
import { BehaviourInsightGenerator } from "./BehaviourInsightGenerator";
import { RiskInsightGenerator } from "./RiskInsightGenerator";
import { GoalInsightGenerator } from "./GoalInsightGenerator";
import { OpportunityInsightGenerator } from "./OpportunityInsightGenerator";
import { SpendingInsightGenerator } from "./SpendingInsightGenerator";

export { TrendInsightGenerator } from "./TrendInsightGenerator";
export { BehaviourInsightGenerator } from "./BehaviourInsightGenerator";
export { RiskInsightGenerator } from "./RiskInsightGenerator";
export { GoalInsightGenerator } from "./GoalInsightGenerator";
export { OpportunityInsightGenerator } from "./OpportunityInsightGenerator";
export { SpendingInsightGenerator } from "./SpendingInsightGenerator";

/**
 * Factory that wires all default InsightGenerators into a ready-to-use InsightEngine.
 *
 * This is the only place in the codebase where concrete generator names appear.
 * InsightEngine and InsightRegistry are generator-agnostic.
 *
 * To add a new generator:
 *   1. Create MyInsightGenerator implementing InsightGenerator
 *   2. Add .register(new MyInsightGenerator()) below
 */
export function createDefaultInsightEngine(): IInsightEngine {
  const registry = new InsightRegistry()
    .register(new TrendInsightGenerator())
    .register(new BehaviourInsightGenerator())
    .register(new RiskInsightGenerator())
    .register(new GoalInsightGenerator())
    .register(new OpportunityInsightGenerator())
    .register(new SpendingInsightGenerator());

  return new InsightEngine(registry);
}
