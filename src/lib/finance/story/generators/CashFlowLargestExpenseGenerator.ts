import { randomUUID } from "crypto";
import type { IStoryBlockGenerator } from "../IStoryBlockGenerator";
import type { StoryBlockGeneratorDefinition } from "../StoryBlockGeneratorDefinition";
import type { StoryEngineInput } from "../StoryEngineInput";
import type { StoryBlock } from "../StoryBlock";
import { StoryBlockGeneratorType } from "../StoryBlockGeneratorType";
import { StoryCategory } from "../StoryCategory";
import { StoryBlockType } from "../StoryBlockType";
import { StoryConfidence } from "../StoryConfidence";
import { EMPTY_STORY_EVIDENCE } from "../StoryEvidence";
import { StoryTemplates } from "../StoryTemplates";
import { findLargestExpense } from "./LargestExpenseFinder";

/**
 * Produces the "Largest Expense This Month" StoryBlock — the EC-011
 * vertical slice.
 *
 * Reads only FinancialAggregate (via LargestExpenseFinder). Has no upstream
 * MetricType/insight/recommendation to reference because no such metric
 * exists yet — evidence points at the raw transaction instead, which is
 * exactly the traceability chain's bottom rung (FinancialAggregate ->
 * Transactions).
 */
export class CashFlowLargestExpenseGenerator implements IStoryBlockGenerator {
  definition(): StoryBlockGeneratorDefinition {
    return {
      id: StoryBlockGeneratorType.CASH_FLOW_LARGEST_EXPENSE,
      category: StoryCategory.CASH_FLOW,
      name: "Cash Flow — Largest Expense",
      description: "Narrates the single largest expense transaction in the period.",
      version: "1.0.0",
    };
  }

  generate(input: StoryEngineInput): ReadonlyArray<StoryBlock> {
    const fact = findLargestExpense(input.aggregate);
    if (!fact) return [];

    const copy = StoryTemplates.largestExpense(fact);

    const block: StoryBlock = Object.freeze({
      id: randomUUID(),
      title: copy.title,
      category: StoryCategory.CASH_FLOW,
      blockType: StoryBlockType.LARGEST_EXPENSE,
      priority: copy.priority,
      // A direct read of a transaction, not a statistical inference —
      // see StoryConfidence.ts's HIGH branch rationale.
      confidence: StoryConfidence.HIGH,
      summary: copy.summary,
      explanation: copy.explanation,
      userImpact: copy.userImpact,
      recommendedAction: copy.recommendedAction,
      supportingMetrics: Object.freeze([]),
      supportingInsights: Object.freeze([]),
      supportingRecommendations: Object.freeze([]),
      evidence: Object.freeze({
        ...EMPTY_STORY_EVIDENCE,
        supportingTransactionIds: Object.freeze([fact.transaction.id]),
      }),
      metadata: Object.freeze({
        transactionId: fact.transaction.id,
        percentOfTotalExpenses: fact.percentOfTotalExpenses,
        multipleOfAverage: fact.multipleOfAverage,
      }),
      generatedAt: new Date(),
    });

    return [block];
  }
}
