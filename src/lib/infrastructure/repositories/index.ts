import type { PrismaClient } from "@prisma/client";
import type { ITransactionRepository } from "../../finance/types/ITransactionRepository";
import type { IDebtRepository } from "../../finance/debt/IDebtRepository";
import type { IGoalRepository } from "../../finance/goals/IGoalRepository";
import type { IInvestmentRepository } from "../../finance/investments/IInvestmentRepository";
import type { IBudgetRepository } from "../../finance/aggregation/IBudgetRepository";
import type { IRecurringPaymentRepository } from "../../finance/aggregation/IRecurringPaymentRepository";

import { PrismaTransactionRepository } from "./PrismaTransactionRepository";
import { PrismaDebtRepository } from "./PrismaDebtRepository";
import { PrismaGoalRepository } from "./PrismaGoalRepository";
import { PrismaInvestmentRepository } from "./PrismaInvestmentRepository";
import { PrismaBudgetRepository } from "./PrismaBudgetRepository";
import { PrismaRecurringPaymentRepository } from "./PrismaRecurringPaymentRepository";

export { PrismaTransactionRepository } from "./PrismaTransactionRepository";
export { PrismaDebtRepository } from "./PrismaDebtRepository";
export { PrismaGoalRepository } from "./PrismaGoalRepository";
export { PrismaInvestmentRepository } from "./PrismaInvestmentRepository";
export { PrismaBudgetRepository } from "./PrismaBudgetRepository";
export { PrismaRecurringPaymentRepository } from "./PrismaRecurringPaymentRepository";
// Not part of DefaultRepositories/createDefaultRepositories() below — those
// are specifically the repos FinancialAggregator needs. FinancialMonth and
// StatementRequirement are consumed by FinancialClosingFactory.ts instead
// (EC-013), which constructs them directly to keep that bundle's purpose
// unambiguous. Exported here only for discoverability alongside their peers.
export { PrismaFinancialMonthRepository } from "./PrismaFinancialMonthRepository";
export { PrismaStatementRequirementRepository } from "./PrismaStatementRequirementRepository";

export interface DefaultRepositories {
  transactions: ITransactionRepository;
  debts: IDebtRepository;
  goals: IGoalRepository;
  investments: IInvestmentRepository;
  budgets: IBudgetRepository;
  recurringPayments: IRecurringPaymentRepository;
}

export function createDefaultRepositories(db: PrismaClient): DefaultRepositories {
  return {
    transactions:     new PrismaTransactionRepository(db),
    debts:            new PrismaDebtRepository(db),
    goals:            new PrismaGoalRepository(db),
    investments:      new PrismaInvestmentRepository(),
    budgets:          new PrismaBudgetRepository(db),
    recurringPayments: new PrismaRecurringPaymentRepository(db),
  };
}
