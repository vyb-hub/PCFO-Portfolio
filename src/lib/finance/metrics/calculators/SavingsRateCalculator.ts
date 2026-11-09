import { MoneyUtils } from "../../utils/MoneyUtils";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";

/**
 * Savings Rate = (total income − total spending) / total income
 *
 * Income:  all CREDIT transactions
 * Spending: all DEBIT transactions (TRANSFER excluded — money movement, not spending)
 *
 * Returns a decimal fraction: 0.25 = 25% savings rate.
 * May be negative when spending exceeds income.
 * Returns 0 when income is zero.
 */
export class SavingsRateCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.SAVINGS_RATE,
    name: "Savings Rate",
    description:
      "Percentage of gross income saved after all spending. Calculated as (income − expenses) / income.",
    category: MetricCategory.SAVINGS,
    unit: MetricUnit.PERCENTAGE,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: {
      min: 0.1,
      max: null,
      optimal: 0.2,
      description: "A savings rate below 10% is a warning sign; 20% or higher is healthy.",
    },
  };

  definition(): MetricDefinition {
    return SavingsRateCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.SAVINGS_RATE;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.TRANSACTIONS];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const credits = aggregate.transactions.filter((t) => t.type === "CREDIT");
    const debits  = aggregate.transactions.filter((t) => t.type === "DEBIT");

    const totalIncome   = MoneyUtils.sum(credits.map((t) => t.amount));
    const totalSpending = MoneyUtils.sum(debits.map((t) => t.amount));

    const value =
      totalIncome.amount === 0
        ? 0
        : (totalIncome.amount - totalSpending.amount) / totalIncome.amount;

    return {
      type: MetricType.SAVINGS_RATE,
      value,
      unit: MetricUnit.PERCENTAGE,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: SavingsRateCalculator.DEFINITION,
    };
  }
}
