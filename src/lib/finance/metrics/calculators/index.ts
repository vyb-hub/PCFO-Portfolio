import { MetricRegistry } from "../MetricRegistry";
import { MetricsEngine } from "../MetricsEngine";
import type { IMetricsEngine } from "../IMetricsEngine";

import { SavingsRateCalculator }      from "./SavingsRateCalculator";
import { CashFlowCalculator }         from "./CashFlowCalculator";
import { BurnRateCalculator }         from "./BurnRateCalculator";
import { NetWorthCalculator }         from "./NetWorthCalculator";
import { DebtToIncomeCalculator }     from "./DebtToIncomeCalculator";
import { CreditUtilisationCalculator } from "./CreditUtilisationCalculator";
import { RecurringSpendCalculator }   from "./RecurringSpendCalculator";

export {
  SavingsRateCalculator,
  CashFlowCalculator,
  BurnRateCalculator,
  NetWorthCalculator,
  DebtToIncomeCalculator,
  CreditUtilisationCalculator,
  RecurringSpendCalculator,
};

/**
 * The sole wiring point for the default Metrics Platform.
 *
 * Adding a new metric = implement MetricCalculator + register it here.
 * The MetricsEngine never names a specific calculator.
 */
export function createDefaultMetricsEngine(): IMetricsEngine {
  const registry = new MetricRegistry()
    .register(new SavingsRateCalculator())
    .register(new CashFlowCalculator())
    .register(new BurnRateCalculator())
    .register(new NetWorthCalculator())
    .register(new DebtToIncomeCalculator())
    .register(new CreditUtilisationCalculator())
    .register(new RecurringSpendCalculator());

  return new MetricsEngine(registry);
}
