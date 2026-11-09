import { StoryRegistry } from "../StoryRegistry";
import { CashFlowLargestExpenseGenerator } from "./CashFlowLargestExpenseGenerator";

/**
 * Sole wiring point for story block generators.
 *
 * New generator = one file + one .register() line here. StoryEngine and
 * StoryRegistry never name a concrete generator.
 */
export function createDefaultStoryRegistry(): StoryRegistry {
  return new StoryRegistry()
    .register(new CashFlowLargestExpenseGenerator());
}
