import { completeJSON } from "@/lib/ai/claude";
import { MISSION_STRATEGY_SYSTEM } from "@/lib/ai/prompts";
import type { MissionState } from "./calculator";
import { format } from "date-fns";

export interface Strategy {
  id: string;
  category: "debt" | "savings" | "behavior" | "cashflow";
  title: string;
  body: string;
  impact: string;            // "Accelerates ₹5L target by ~24 days"
  impactDays?: number;       // days saved on goal
  priority: "high" | "medium" | "low";
  actionable: boolean;
}

export async function generateStrategies(
  state: MissionState
): Promise<Strategy[]> {
  const context = buildStrategyContext(state);

  const raw = await completeJSON<Strategy[]>(
    MISSION_STRATEGY_SYSTEM,
    context,
    { maxTokens: 3000 }
  );

  return raw.map((s, i) => ({ ...s, id: `strategy-${i}` })).slice(0, 8);
}

function buildStrategyContext(state: MissionState): string {
  return JSON.stringify({
    mission: {
      savingsGoal: state.savingsGoalAmount,
      currentSavings: state.currentSavings,
      savingsProgress: `${(state.savingsProgress * 100).toFixed(1)}%`,
      monthsToGoal: state.monthsToSavingsGoal,
      projectedDate: state.projectedSavingsDate
        ? format(state.projectedSavingsDate, "MMMM yyyy")
        : null,
      monthlySavingsRate: state.monthlySavingsRate,
      savingsVelocity: state.savingsVelocity,
    },
    debt: {
      totalDebt: state.totalDebt,
      monthlyPayment: state.monthlyDebtPayment,
      debtProgress: `${(state.debtProgress * 100).toFixed(1)}%`,
      monthsToDebtFree: state.monthsToDebtFree,
      debts: state.debtItems.map((d) => ({
        name: d.name,
        balance: d.currentBalance,
        emi: d.emiAmount,
        rate: d.interestRate,
      })),
    },
    cashflow: {
      monthlyIncome: state.monthlyIncome,
      monthlyExpenses: state.monthlyExpenses,
      netCashFlow: state.netCashFlow,
      disposableIncome: state.disposableIncome,
    },
    behavioralLevers: {
      viceSavingsPotential: state.viceSavingsPotential,
      subscriptionWaste: state.subscriptionWaste,
    },
    healthScore: state.healthScore,
  });
}
