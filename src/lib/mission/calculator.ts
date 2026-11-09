// ============================================================
// Mission Calculator
// Projects debt payoff dates, savings milestones, and
// computes the financial health score.
// ============================================================

import { db } from "@/lib/db/prisma";
import { format, addMonths, differenceInMonths, startOfMonth, endOfMonth } from "date-fns";

export interface MissionState {
  // Savings
  savingsGoalAmount: number;     // ₹5,00,000
  currentSavings: number;        // detected from salary - expenses
  savingsProgress: number;       // 0.0 – 1.0
  monthlySavingsRate: number;    // avg last 3 months
  projectedSavingsDate: Date | null;
  monthsToSavingsGoal: number | null;
  savingsVelocity: number;       // positive = accelerating, negative = slowing

  // Debt
  totalDebt: number;
  totalOriginalDebt: number;
  debtPaidToDate: number;
  debtProgress: number;          // 0.0 – 1.0
  monthlyDebtPayment: number;    // total EMI commitment
  projectedDebtFreeDate: Date | null;
  monthsToDebtFree: number | null;
  debtItems: DebtItem[];

  // Cash flow
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  disposableIncome: number;      // after EMIs
  burnRate: number;

  // Health score
  healthScore: number;           // 0 – 100
  healthBreakdown: HealthBreakdown;

  // Projections
  timeline: TimelinePoint[];

  // Strategy levers
  viceSavingsPotential: number;  // If vice spend cut 30%
  subscriptionWaste: number;     // Inactive subs
}

export interface DebtItem {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  emiAmount: number;
  interestRate?: number;
  projectedEndDate?: Date;
  percentPaid: number;
}

export interface HealthBreakdown {
  savingsRateScore: number;      // 0–25
  debtVelocityScore: number;     // 0–25
  goalProgressScore: number;     // 0–25
  behaviorScore: number;         // 0–25
}

export interface TimelinePoint {
  month: string;
  projectedSavings: number;
  projectedDebt: number;
  milestoneLabel?: string;
}

const SAVINGS_GOAL = 500_000;

export async function computeMissionState(
  userId: string
): Promise<MissionState> {
  const now = new Date();
  const currentPeriod = format(now, "yyyy-MM");
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  // ── Fetch data ────────────────────────────────────────────
  const [
    goals,
    debts,
    currentMonthTxns,
    last3MonthsTxns,
    viceSpend,
    subscriptions,
  ] = await Promise.all([
    db.goal.findMany({ where: { userId, isActive: true } }),
    db.debt.findMany({ where: { userId, isActive: true } }),
    db.transaction.findMany({
      where: { userId, date: { gte: start, lte: end }, ignored: false },
    }),
    db.transaction.findMany({
      where: {
        userId,
        date: { gte: addMonths(start, -3) },
        ignored: false,
      },
    }),
    db.transaction.aggregate({
      where: {
        userId,
        category: { in: ["alcohol", "booze", "cigarettes", "smoking", "fuel"] },
        type: "DEBIT",
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    db.subscription.findMany({ where: { userId } }),
  ]);

  // ── Monthly income & expenses ─────────────────────────────
  const monthlyIncome = currentMonthTxns
    .filter((t) => t.type === "CREDIT")
    .reduce((s, t) => s + t.amount, 0);

  const monthlyExpenses = currentMonthTxns
    .filter((t) => t.type === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);

  const netCashFlow = monthlyIncome - monthlyExpenses;

  // ── 3-month avg savings rate ──────────────────────────────
  const threeMonthIncome = last3MonthsTxns
    .filter((t) => t.type === "CREDIT")
    .reduce((s, t) => s + t.amount, 0) / 3;

  const threeMonthExpenses = last3MonthsTxns
    .filter((t) => t.type === "DEBIT")
    .reduce((s, t) => s + t.amount, 0) / 3;

  const monthlySavingsRate = threeMonthIncome - threeMonthExpenses;

  // ── Savings goal ──────────────────────────────────────────
  const savingsGoal = goals.find((g) => g.type === "SAVINGS_RESERVE") ?? null;
  const savingsGoalAmount = savingsGoal?.targetAmount ?? SAVINGS_GOAL;
  const currentSavings = savingsGoal?.currentAmount ?? Math.max(0, netCashFlow * 1.5); // estimate
  const savingsProgress = Math.min(1, currentSavings / savingsGoalAmount);

  let monthsToSavingsGoal: number | null = null;
  let projectedSavingsDate: Date | null = null;

  if (monthlySavingsRate > 0) {
    const remaining = savingsGoalAmount - currentSavings;
    monthsToSavingsGoal = Math.ceil(remaining / monthlySavingsRate);
    projectedSavingsDate = addMonths(now, monthsToSavingsGoal);
  }

  // ── Debt ──────────────────────────────────────────────────
  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalOriginalDebt = debts.reduce((s, d) => s + d.principalAmount, 0);
  const debtPaidToDate = totalOriginalDebt - totalDebt;
  const debtProgress = totalOriginalDebt > 0 ? debtPaidToDate / totalOriginalDebt : 0;
  const monthlyDebtPayment = debts.reduce((s, d) => s + (d.emiAmount ?? 0), 0);
  const disposableIncome = monthlyIncome - monthlyDebtPayment;

  let monthsToDebtFree: number | null = null;
  let projectedDebtFreeDate: Date | null = null;

  if (monthlyDebtPayment > 0 && totalDebt > 0) {
    monthsToDebtFree = Math.ceil(totalDebt / monthlyDebtPayment);
    projectedDebtFreeDate = addMonths(now, monthsToDebtFree);
  }

  const debtItems: DebtItem[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    currentBalance: d.currentBalance,
    emiAmount: d.emiAmount ?? 0,
    interestRate: d.interestRate ?? undefined,
    projectedEndDate: d.projectedEndDate ?? undefined,
    percentPaid: d.principalAmount > 0
      ? ((d.principalAmount - d.currentBalance) / d.principalAmount) * 100
      : 0,
  }));

  // ── Health score ──────────────────────────────────────────
  const savingsRate = monthlyIncome > 0 ? netCashFlow / monthlyIncome : 0;
  const savingsRateScore = Math.min(25, Math.round(savingsRate * 100));

  const debtVelocityScore = debtProgress > 0
    ? Math.min(25, Math.round(debtProgress * 60))
    : 0;

  const goalProgressScore = Math.min(25, Math.round(savingsProgress * 50));

  const viceAmount = viceSpend._sum.amount ?? 0;
  const viceRatio = monthlyIncome > 0 ? viceAmount / monthlyIncome : 0;
  const behaviorScore = Math.min(25, Math.round((1 - Math.min(viceRatio * 3, 1)) * 25));

  const healthScore = savingsRateScore + debtVelocityScore + goalProgressScore + behaviorScore;

  // ── Timeline projection (12 months) ──────────────────────
  const timeline: TimelinePoint[] = [];
  let projSavings = currentSavings;
  let projDebt = totalDebt;

  for (let i = 1; i <= 12; i++) {
    const monthDate = addMonths(now, i);
    projSavings += monthlySavingsRate;
    projDebt = Math.max(0, projDebt - monthlyDebtPayment);

    const point: TimelinePoint = {
      month: format(monthDate, "MMM yy"),
      projectedSavings: Math.round(projSavings),
      projectedDebt: Math.round(projDebt),
    };

    if (projSavings >= savingsGoalAmount && !timeline.find((t) => t.milestoneLabel?.includes("₹5L"))) {
      point.milestoneLabel = "₹5L reached";
    }
    if (projDebt <= 0 && !timeline.find((t) => t.milestoneLabel?.includes("Debt-free"))) {
      point.milestoneLabel = "Debt-free";
    }

    timeline.push(point);
  }

  // ── Strategy levers ───────────────────────────────────────
  const viceSavingsPotential = (viceAmount * 0.30); // 30% reduction potential
  const inactiveSubs = subscriptions.filter((s) => !s.isActive);
  const subscriptionWaste = inactiveSubs.reduce((s, sub) => s + sub.amount, 0);

  // ── Savings velocity (compare to last month) ──────────────
  const prevMonthStart = startOfMonth(addMonths(now, -1));
  const prevMonthEnd = endOfMonth(addMonths(now, -1));
  const prevMonthTxns = last3MonthsTxns.filter(
    (t) => t.date >= prevMonthStart && t.date <= prevMonthEnd
  );
  const prevIncome = prevMonthTxns
    .filter((t) => t.type === "CREDIT")
    .reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevMonthTxns
    .filter((t) => t.type === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);
  const prevSavings = prevIncome - prevExpenses;
  const savingsVelocity = netCashFlow - prevSavings;

  const burnRate = monthlyExpenses / Math.max(1, new Date().getDate());

  return {
    savingsGoalAmount,
    currentSavings,
    savingsProgress,
    monthlySavingsRate,
    projectedSavingsDate,
    monthsToSavingsGoal,
    savingsVelocity,
    totalDebt,
    totalOriginalDebt,
    debtPaidToDate,
    debtProgress,
    monthlyDebtPayment,
    projectedDebtFreeDate,
    monthsToDebtFree,
    debtItems,
    monthlyIncome,
    monthlyExpenses,
    netCashFlow,
    disposableIncome,
    burnRate,
    healthScore,
    healthBreakdown: { savingsRateScore, debtVelocityScore, goalProgressScore, behaviorScore },
    timeline,
    viceSavingsPotential,
    subscriptionWaste,
  };
}
