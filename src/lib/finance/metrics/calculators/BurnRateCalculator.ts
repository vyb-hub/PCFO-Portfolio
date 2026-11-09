import { MoneyUtils } from "../../utils/MoneyUtils";
import { DateUtils } from "../../utils/DateUtils";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";

const DAYS_PER_MONTH = 30.44;

/**
 * Burn Rate = total DEBIT spending / months in period
 *
 * Returns average monthly spending in the default currency (INR).
 * TRANSFER transactions are excluded — they are money movements, not spending.
 *
 * No universal threshold — burn rate depends entirely on the user's income level.
 * The Insight Engine can create contextual thresholds relative to income.
 */
export class BurnRateCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.BURN_RATE,
    name: "Burn Rate",
    description:
      "Average monthly spending (DEBIT transactions only). Normalised to a one-month figure regardless of the aggregate period length.",
    category: MetricCategory.CASH_FLOW,
    unit: MetricUnit.CURRENCY,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: null,
  };

  definition(): MetricDefinition {
    return BurnRateCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.BURN_RATE;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.EXPENSES];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const debits       = aggregate.transactions.filter((t) => t.type === "DEBIT");
    const totalSpend   = MoneyUtils.sum(debits.map((t) => t.amount));
    const days         = DateUtils.lengthInDays(aggregate.period.range);
    const months       = Math.max(days / DAYS_PER_MONTH, 1 / DAYS_PER_MONTH);
    const monthlyBurn  = totalSpend.amount / months;

    return {
      type: MetricType.BURN_RATE,
      value: monthlyBurn,
      unit: MetricUnit.CURRENCY,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: BurnRateCalculator.DEFINITION,
    };
  }
}
