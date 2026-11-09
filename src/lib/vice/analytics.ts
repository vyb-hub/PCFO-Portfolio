import { db } from "@/lib/db/prisma";
import {
  startOfMonth, endOfMonth, subMonths, format,
  eachDayOfInterval, getDay, getHours,
} from "date-fns";

export type ViceType = "ALCOHOL" | "CIGARETTES" | "FUEL";

export interface ViceSummary {
  type: ViceType;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  transactionCount: number;
  avgPerTransaction: number;

  // Behavioral
  weekendTotal: number;
  weekdayTotal: number;
  weekendRatio: number;      // 0-1
  lateNightTotal: number;
  postSalaryTotal: number;

  // Day-of-week distribution [0=Sun … 6=Sat]
  byDayOfWeek: number[];

  // Hourly distribution [0-23]
  byHour: number[];

  // Daily totals for trend chart
  dailyTotals: { date: string; amount: number }[];

  // AI label metrics
  burnRate: number;        // per day this month
  weekendDamageIndex: number;  // ratio of weekend vs avg weekday
}

export interface BehavioralSummary {
  alcohol: ViceSummary;
  cigarettes: ViceSummary;
  fuel: ViceSummary;
  totalViceSpend: number;
  viceAsPercentOfExpenses: number;
  salaryToViceCorrelation: string;  // "high" | "medium" | "low"
  dominantPattern: string;          // textual observation
}

const VICE_CATEGORY_MAP: Record<ViceType, string[]> = {
  ALCOHOL: ["alcohol", "booze"],
  CIGARETTES: ["cigarettes", "smoking"],
  FUEL: ["fuel"],
};

export async function getBehavioralSummary(
  userId: string,
  targetDate: Date = new Date()
): Promise<BehavioralSummary> {
  const [alcohol, cigarettes, fuel] = await Promise.all([
    getViceSummary(userId, "ALCOHOL", targetDate),
    getViceSummary(userId, "CIGARETTES", targetDate),
    getViceSummary(userId, "FUEL", targetDate),
  ]);

  const totalViceSpend = alcohol.currentMonth + cigarettes.currentMonth + fuel.currentMonth;

  // Total expenses this month
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const expTotal = await db.transaction.aggregate({
    where: { userId, type: "DEBIT", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });
  const totalExpenses = expTotal._sum.amount ?? 1;
  const viceAsPercentOfExpenses = (totalViceSpend / totalExpenses) * 100;

  // Salary-to-vice correlation: check if vice spend spikes in first 5 days after salary
  const postSalaryVice = alcohol.postSalaryTotal + cigarettes.postSalaryTotal;
  const salaryToViceCorrelation =
    postSalaryVice > totalViceSpend * 0.4
      ? "high"
      : postSalaryVice > totalViceSpend * 0.2
      ? "medium"
      : "low";

  const dominantPattern = computeDominantPattern(alcohol, cigarettes, fuel);

  return {
    alcohol,
    cigarettes,
    fuel,
    totalViceSpend,
    viceAsPercentOfExpenses,
    salaryToViceCorrelation,
    dominantPattern,
  };
}

async function getViceSummary(
  userId: string,
  type: ViceType,
  targetDate: Date
): Promise<ViceSummary> {
  const categories = VICE_CATEGORY_MAP[type];
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const prevStart = startOfMonth(subMonths(targetDate, 1));
  const prevEnd = endOfMonth(subMonths(targetDate, 1));

  const [current, previous] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        category: { in: categories },
        type: "DEBIT",
        date: { gte: start, lte: end },
      },
    }),
    db.transaction.findMany({
      where: {
        userId,
        category: { in: categories },
        type: "DEBIT",
        date: { gte: prevStart, lte: prevEnd },
      },
    }),
  ]);

  const currentMonth = current.reduce((s, t) => s + t.amount, 0);
  const previousMonth = previous.reduce((s, t) => s + t.amount, 0);
  const changePercent = previousMonth > 0
    ? ((currentMonth - previousMonth) / previousMonth) * 100
    : 0;

  // Behavioral breakdown
  let weekendTotal = 0;
  let weekdayTotal = 0;
  let lateNightTotal = 0;
  let postSalaryTotal = 0;

  const byDayOfWeek = new Array(7).fill(0) as number[];
  const byHour = new Array(24).fill(0) as number[];

  for (const tx of current) {
    const dow = getDay(tx.date);
    const hour = getHours(tx.date);
    const isWeekend = dow === 0 || dow === 6;
    const isLateNight = hour >= 22 || hour <= 4;

    byDayOfWeek[dow] = (byDayOfWeek[dow] ?? 0) + tx.amount;
    byHour[hour] = (byHour[hour] ?? 0) + tx.amount;

    if (isWeekend) weekendTotal += tx.amount;
    else weekdayTotal += tx.amount;
    if (isLateNight) lateNightTotal += tx.amount;

    // Post-salary: metadata flag stored on transaction
    if ((tx.metadata as { isPostSalary?: boolean } | null)?.isPostSalary) {
      postSalaryTotal += tx.amount;
    }
  }

  const weekendRatio = currentMonth > 0 ? weekendTotal / currentMonth : 0;

  // Daily totals for trend chart
  const days = eachDayOfInterval({ start, end: new Date() < end ? new Date() : end });
  const dailyMap: Record<string, number> = {};
  for (const tx of current) {
    const key = format(tx.date, "yyyy-MM-dd");
    dailyMap[key] = (dailyMap[key] ?? 0) + tx.amount;
  }
  const dailyTotals = days.map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    amount: dailyMap[format(d, "yyyy-MM-dd")] ?? 0,
  }));

  const daysElapsed = Math.max(1, days.length);
  const burnRate = currentMonth / daysElapsed;

  // Weekend damage index: weekend avg per day vs weekday avg per day
  const weekendDays = days.filter((d) => [0, 6].includes(getDay(d))).length;
  const weekdayDays = days.length - weekendDays;
  const weekendDailyAvg = weekendDays > 0 ? weekendTotal / weekendDays : 0;
  const weekdayDailyAvg = weekdayDays > 0 ? weekdayTotal / weekdayDays : 0;
  const weekendDamageIndex = weekdayDailyAvg > 0
    ? weekendDailyAvg / weekdayDailyAvg
    : 0;

  return {
    type,
    currentMonth,
    previousMonth,
    changePercent,
    transactionCount: current.length,
    avgPerTransaction: current.length > 0 ? currentMonth / current.length : 0,
    weekendTotal,
    weekdayTotal,
    weekendRatio,
    lateNightTotal,
    postSalaryTotal,
    byDayOfWeek,
    byHour,
    dailyTotals,
    burnRate,
    weekendDamageIndex,
  };
}

function computeDominantPattern(
  alcohol: ViceSummary,
  cigarettes: ViceSummary,
  fuel: ViceSummary
): string {
  const patterns: string[] = [];

  if (alcohol.weekendDamageIndex > 2.5) {
    patterns.push("Weekend council convenes with significant financial enthusiasm");
  }
  if (cigarettes.lateNightTotal > cigarettes.currentMonth * 0.5) {
    patterns.push("Nicotine demand operates primarily in night mode");
  }
  if (fuel.currentMonth > fuel.previousMonth * 1.3) {
    patterns.push("Fuel spend suggests either traffic worsened or the existential drives are back");
  }
  if (alcohol.postSalaryTotal > alcohol.currentMonth * 0.35) {
    patterns.push("KSBC visits cluster within 72 hours of salary credit");
  }

  return patterns[0] ?? "Behavioral patterns stable across all vice categories";
}
