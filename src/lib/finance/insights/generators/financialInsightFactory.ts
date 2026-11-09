import { FinancialInsightRegistry } from "../FinancialInsightRegistry";
import { FinancialInsightEngine } from "../FinancialInsightEngine";
import { FinancialInsightService } from "../FinancialInsightService";
import type { IFinancialInsightEngine } from "../IFinancialInsightEngine";
import type { IFinancialInsightService } from "../IFinancialInsightService";

import { SavingsInsightGenerator } from "./SavingsInsightGenerator";
import { CashFlowInsightGenerator } from "./CashFlowInsightGenerator";
import { DebtInsightGenerator } from "./DebtInsightGenerator";
import { DebtToIncomeInsightGenerator } from "./DebtToIncomeInsightGenerator";
import { CreditInsightGenerator } from "./CreditInsightGenerator";
import { SpendingMetricInsightGenerator } from "./SpendingMetricInsightGenerator";
import { InvestmentInsightGenerator } from "./InvestmentInsightGenerator";
import { EmergencyFundInsightGenerator } from "./EmergencyFundInsightGenerator";
import { NetWorthInsightGenerator } from "./NetWorthInsightGenerator";
import { GoalMetricInsightGenerator } from "./GoalMetricInsightGenerator";

export {
  SavingsInsightGenerator,
  CashFlowInsightGenerator,
  DebtInsightGenerator,
  DebtToIncomeInsightGenerator,
  CreditInsightGenerator,
  SpendingMetricInsightGenerator,
  InvestmentInsightGenerator,
  EmergencyFundInsightGenerator,
  NetWorthInsightGenerator,
  GoalMetricInsightGenerator,
};

/**
 * Wires all metric-based IInsightGenerator plugins into a ready-to-use
 * FinancialInsightEngine.
 *
 * This is the ONLY place in the codebase where concrete financial generator
 * names are assembled. The engine and registry are generator-agnostic.
 *
 * To add a new generator:
 *   1. Create MyInsightGenerator implementing IInsightGenerator
 *   2. Add .register(new MyInsightGenerator()) below
 */
export function createDefaultFinancialInsightEngine(): IFinancialInsightEngine {
  const registry = new FinancialInsightRegistry();
  registry.register(new SavingsInsightGenerator());
  registry.register(new CashFlowInsightGenerator());
  registry.register(new DebtInsightGenerator());
  registry.register(new DebtToIncomeInsightGenerator());
  registry.register(new CreditInsightGenerator());
  registry.register(new SpendingMetricInsightGenerator());
  registry.register(new InvestmentInsightGenerator());
  registry.register(new EmergencyFundInsightGenerator());
  registry.register(new NetWorthInsightGenerator());
  registry.register(new GoalMetricInsightGenerator());
  return new FinancialInsightEngine(registry);
}

export function createDefaultFinancialInsightService(): IFinancialInsightService {
  return new FinancialInsightService(createDefaultFinancialInsightEngine());
}
