import { MoneyUtils } from "../../utils/MoneyUtils";
import { DateUtils } from "../../utils/DateUtils";
import { Frequency } from "../../types/Frequency";
import { MetricType, MetricUnit, CalculationFrequency } from "../MetricType";
import { MetricCategory } from "../MetricCategory";
import { AggregateRequirement } from "../AggregateRequirement";
import type { MetricCalculator } from "../MetricCalculator";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult } from "../MetricResult";
import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";
import type { Money } from "../../types/Money";

const DAYS_PER_MONTH = 30.44;

/**
 * Debt-to-Income Ratio = total monthly debt obligations / monthly gross income
 *
 * All debt minimum payments are normalised to a monthly figure using the
 * payment frequency declared on each debt instrument.
 *
 * Monthly income = sum(CREDIT transactions) / months in period.
 *
 * Returns a decimal ratio: 0.28 = 28% DTI.
 * Returns 0 when income is zero (DTI is undefined without income).
 */
export class DebtToIncomeCalculator implements MetricCalculator {
  private static readonly DEFINITION: MetricDefinition = {
    id: MetricType.DEBT_TO_INCOME_RATIO,
    name: "Debt-to-Income Ratio",
    description:
      "Total monthly debt obligations as a fraction of monthly gross income. " +
      "Includes all active debts with a declared minimum payment.",
    category: MetricCategory.DEBT,
    unit: MetricUnit.RATIO,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold: {
      min: null,
      max: 0.43,
      optimal: 0.28,
      description:
        "A DTI above 43% is the standard threshold where lenders consider a borrower over-leveraged. " +
        "Below 28% is considered healthy.",
    },
  };

  definition(): MetricDefinition {
    return DebtToIncomeCalculator.DEFINITION;
  }

  supports(type: MetricType): boolean {
    return type === MetricType.DEBT_TO_INCOME_RATIO;
  }

  requiredData(): ReadonlyArray<AggregateRequirement> {
    return [AggregateRequirement.DEBTS, AggregateRequirement.INCOME];
  }

  calculate(aggregate: FinancialAggregate): MetricResult {
    const credits       = aggregate.transactions.filter((t) => t.type === "CREDIT");
    const totalIncome   = MoneyUtils.sum(credits.map((t) => t.amount));
    const days          = DateUtils.lengthInDays(aggregate.period.range);
    const months        = Math.max(days / DAYS_PER_MONTH, 1 / DAYS_PER_MONTH);
    const monthlyIncome = totalIncome.amount / months;

    if (monthlyIncome === 0) {
      return {
        type: MetricType.DEBT_TO_INCOME_RATIO,
        value: 0,
        unit: MetricUnit.RATIO,
        period: aggregate.period,
        calculatedAt: new Date(),
        definition: DebtToIncomeCalculator.DEFINITION,
      };
    }

    const totalMonthlyDebt = aggregate.debts.reduce((sum, debt) => {
      const monthly = this._toMonthlyPayment(debt.minimumPayment, debt.paymentFrequency);
      return sum + monthly.amount;
    }, 0);

    const dti = totalMonthlyDebt / monthlyIncome;

    return {
      type: MetricType.DEBT_TO_INCOME_RATIO,
      value: dti,
      unit: MetricUnit.RATIO,
      period: aggregate.period,
      calculatedAt: new Date(),
      definition: DebtToIncomeCalculator.DEFINITION,
    };
  }

  /** Normalise any payment frequency to its monthly equivalent. */
  private _toMonthlyPayment(payment: Money, frequency: Frequency): Money {
    const monthlyMultipliers: Record<Frequency, number> = {
      [Frequency.DAILY]:     30.44,
      [Frequency.WEEKLY]:    4.33,
      [Frequency.MONTHLY]:   1,
      [Frequency.QUARTERLY]: 1 / 3,
      [Frequency.ANNUALLY]:  1 / 12,
      [Frequency.IRREGULAR]: 1,
    };
    return MoneyUtils.multiply(payment, monthlyMultipliers[frequency]);
  }
}
