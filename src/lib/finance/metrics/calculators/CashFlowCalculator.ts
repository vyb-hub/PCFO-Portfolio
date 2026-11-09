import { MoneyUtils } from "../../utils/MoneyUtils";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";

/**
 * Cash Flow = sum(CREDIT) − sum(DEBIT)
 *
 * Returns the net cash position for the period in the default currency (INR).
 * Positive = surplus.  Negative = deficit.
 */
export class CashFlowCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.CASH_FLOW,
    name: "Cash Flow",
    description:
      "Net cash position for the period: total income minus total outflows (spending + transfers).",
    category: MetricCategory.CASH_FLOW,
    unit: MetricUnit.CURRENCY,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: {
      min: 0,
      max: null,
      optimal: null,
      description: "Positive cash flow (surplus) is healthy. Negative cash flow is a deficit.",
    },
  };

  definition(): MetricDefinition {
    return CashFlowCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.CASH_FLOW;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.INCOME, AggregateRequirement.EXPENSES];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const totalIncome   = MoneyUtils.sum(aggregate.income.all.map((t) => t.amount));
    const totalOutflows = MoneyUtils.sum(aggregate.expenses.all.map((t) => t.amount));
    const netCashFlow   = MoneyUtils.subtract(totalIncome, totalOutflows);

    return {
      type: MetricType.CASH_FLOW,
      value: netCashFlow.amount,
      unit: MetricUnit.CURRENCY,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: CashFlowCalculator.DEFINITION,
    };
  }
}
