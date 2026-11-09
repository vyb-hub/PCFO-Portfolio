import { MoneyUtils } from "../../utils/MoneyUtils";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";

/**
 * Recurring Spend = sum of DEBIT transactions where isRecurring === true
 *
 * Recurring transactions are identified by the ingestion pipeline and flagged
 * on TransactionRecord.isRecurring. This metric totals their absolute value
 * for the period, providing a view of committed fixed costs.
 *
 * No universal threshold — the Insight Engine can contextualise relative to income.
 */
export class RecurringSpendCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.RECURRING_SPEND,
    name: "Recurring Spend",
    description:
      "Total committed recurring expenses for the period — subscriptions, " +
      "standing orders, and other flagged recurring DEBIT transactions.",
    category: MetricCategory.BEHAVIOUR,
    unit: MetricUnit.CURRENCY,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: null,
  };

  definition(): MetricDefinition {
    return RecurringSpendCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.RECURRING_SPEND;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.EXPENSES];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const recurringDebits = aggregate.expenses.recurring.filter((t) => t.type === "DEBIT");
    const total           = MoneyUtils.sum(recurringDebits.map((t) => t.amount));

    return {
      type: MetricType.RECURRING_SPEND,
      value: total.amount,
      unit: MetricUnit.CURRENCY,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: RecurringSpendCalculator.DEFINITION,
    };
  }
}
