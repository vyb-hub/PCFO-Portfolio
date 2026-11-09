import { MoneyUtils } from "../../utils/MoneyUtils";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";

/**
 * Net Worth = sum(investment.currentValue) − sum(debt.principalOutstanding)
 *
 * Assets:      all active investment holdings at current market value
 * Liabilities: all active debt outstanding balances
 *
 * LIMITATION: Cash and bank account balances are not included because the
 * FinancialAggregate does not carry explicit account balance snapshots —
 * only transaction history. A future milestone can add a dedicated
 * AccountBalance type to the aggregation layer to close this gap.
 */
export class NetWorthCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.NET_WORTH,
    name: "Net Worth",
    description:
      "Total financial assets (investments) minus total liabilities (debt outstanding). " +
      "Note: excludes cash/bank balances — investment + debt only.",
    category: MetricCategory.WEALTH,
    unit: MetricUnit.CURRENCY,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: {
      min: 0,
      max: null,
      optimal: null,
      description: "Positive net worth is healthy. Negative net worth means liabilities exceed assets.",
    },
  };

  definition(): MetricDefinition {
    return NetWorthCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.NET_WORTH;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.INVESTMENTS, AggregateRequirement.DEBTS];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const totalAssets      = MoneyUtils.sum(aggregate.investments.map((i) => i.currentValue));
    const totalLiabilities = MoneyUtils.sum(aggregate.debts.map((d) => d.principalOutstanding));
    const netWorth         = MoneyUtils.subtract(totalAssets, totalLiabilities);

    return {
      type: MetricType.NET_WORTH,
      value: netWorth.amount,
      unit: MetricUnit.CURRENCY,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: NetWorthCalculator.DEFINITION,
    };
  }
}
