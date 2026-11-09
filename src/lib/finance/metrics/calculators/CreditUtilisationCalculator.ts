import { DebtType } from "../../debt/Debt";
import { MoneyUtils } from "../../utils/MoneyUtils";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";

/**
 * Credit Utilisation = sum(CC outstanding) / sum(CC original principal)
 *
 * Filters aggregate.debts to CREDIT_CARD type only.
 * Uses principalOriginal as a proxy for the credit limit — the Debt model
 * does not carry an explicit creditLimit field. A future schema update can
 * add creditLimit to the Debt model for a more accurate calculation.
 *
 * Returns a decimal fraction: 0.30 = 30% utilisation.
 * Returns 0 when the user has no credit card debt on record.
 */
export class CreditUtilisationCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.CREDIT_UTILIZATION,
    name: "Credit Utilisation",
    description:
      "Outstanding credit card balance as a percentage of total credit card limit. " +
      "Uses principalOriginal as a proxy for the credit limit.",
    category: MetricCategory.DEBT,
    unit: MetricUnit.PERCENTAGE,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: {
      min: null,
      max: 0.3,
      optimal: 0.1,
      description:
        "Credit bureaus recommend staying below 30% utilisation. " +
        "Below 10% is considered excellent.",
    },
  };

  definition(): MetricDefinition {
    return CreditUtilisationCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.CREDIT_UTILIZATION;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.DEBTS];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const creditCards = aggregate.debts.filter((d) => d.type === DebtType.CREDIT_CARD);

    if (creditCards.length === 0) {
      return {
        type: MetricType.CREDIT_UTILIZATION,
        value: 0,
        unit: MetricUnit.PERCENTAGE,
        period: aggregate.period,
        calculatedAt: new Date(),
        definition: CreditUtilisationCalculator.DEFINITION,
      };
    }

    const totalOutstanding = MoneyUtils.sum(creditCards.map((d) => d.principalOutstanding));
    const totalLimit       = MoneyUtils.sum(creditCards.map((d) => d.principalOriginal));
    const utilisation      = totalLimit.amount === 0 ? 0 : totalOutstanding.amount / totalLimit.amount;

    return {
      type: MetricType.CREDIT_UTILIZATION,
      value: utilisation,
      unit: MetricUnit.PERCENTAGE,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: CreditUtilisationCalculator.DEFINITION,
    };
  }
}
