import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { CATEGORY_META } from "@/lib/utils/categories";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval } from "date-fns";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "2024-11"

  const targetDate = monthParam
    ? new Date(`${monthParam}-01`)
    : new Date();

  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const prevStart = startOfMonth(subMonths(targetDate, 1));
  const prevEnd = endOfMonth(subMonths(targetDate, 1));

  const [currentTxns, prevTxns, insights, subscriptions] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: start, lte: end }, ignored: false },
      orderBy: { date: "desc" },
    }),
    db.transaction.findMany({
      where: { userId, date: { gte: prevStart, lte: prevEnd }, ignored: false },
    }),
    db.insight.findMany({
      where: { userId, dismissed: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.subscription.findMany({
      where: { userId, isActive: true },
      orderBy: { nextDueDate: "asc" },
      take: 5,
    }),
  ]);

  // Monthly summary
  const totalIncome = currentTxns
    .filter((t) => t.type === "CREDIT" || t.type === "REFUND")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = currentTxns
    .filter((t) => t.type === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);

  const prevExpenses = prevTxns
    .filter((t) => t.type === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);

  const daysInMonth = end.getDate();
  const daysPassed = Math.min(new Date().getDate(), daysInMonth);
  const burnRate = daysPassed > 0 ? totalExpenses / daysPassed : 0;
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

  // Category breakdown
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  for (const tx of currentTxns) {
    if (tx.type !== "DEBIT") continue;
    if (!categoryMap[tx.category]) categoryMap[tx.category] = { amount: 0, count: 0 };
    categoryMap[tx.category]!.amount += tx.amount;
    categoryMap[tx.category]!.count++;
  }

  const prevCategoryMap: Record<string, number> = {};
  for (const tx of prevTxns) {
    if (tx.type !== "DEBIT") continue;
    prevCategoryMap[tx.category] = (prevCategoryMap[tx.category] ?? 0) + tx.amount;
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .map(([cat, data]) => {
      const meta = CATEGORY_META[cat] ?? CATEGORY_META["other"]!;
      const prev = prevCategoryMap[cat] ?? 0;
      const trend = prev > 0 ? ((data.amount - prev) / prev) * 100 : 0;
      return {
        category: cat,
        displayName: meta.name,
        icon: meta.icon,
        color: meta.color,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactionCount: data.count,
        trend: Math.round(trend),
      };
    });

  // Daily spending trend (last 30 days)
  const trendStart = subMonths(new Date(), 1);
  const trendDays = eachDayOfInterval({ start: trendStart, end: new Date() });

  const dailyMap: Record<string, { income: number; expenses: number }> = {};
  for (const tx of [...currentTxns, ...prevTxns]) {
    const day = format(tx.date, "yyyy-MM-dd");
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expenses: 0 };
    if (tx.type === "CREDIT") dailyMap[day]!.income += tx.amount;
    if (tx.type === "DEBIT") dailyMap[day]!.expenses += tx.amount;
  }

  const spendingTrend = trendDays.map((d) => {
    const day = format(d, "yyyy-MM-dd");
    const data = dailyMap[day] ?? { income: 0, expenses: 0 };
    return {
      date: day,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    };
  });

  // Recent transactions (already sorted desc)
  const recentTransactions = currentTxns.slice(0, 10).map((tx) => {
    const meta = CATEGORY_META[tx.category] ?? CATEGORY_META["other"]!;
    return {
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type,
      category: tx.category,
      categoryDisplay: meta.name,
      categoryIcon: meta.icon,
      categoryColor: meta.color,
      description: tx.description,
      merchant: tx.merchant,
      date: tx.date.toISOString(),
      isRecurring: tx.isRecurring,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        month: format(targetDate, "yyyy-MM"),
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        savingsRate,
        burnRate,
        prevMonthExpenses: prevExpenses,
        expenseTrend:
          prevExpenses > 0
            ? ((totalExpenses - prevExpenses) / prevExpenses) * 100
            : 0,
        transactionCount: currentTxns.length,
      },
      categoryBreakdown,
      spendingTrend,
      recentTransactions,
      topInsights: insights.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        body: i.body,
        severity: i.severity,
        period: i.period,
        createdAt: i.createdAt.toISOString(),
      })),
      upcomingEMIs: subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        currency: s.currency,
        frequency: s.frequency,
        nextDueDate: s.nextDueDate?.toISOString(),
        isActive: s.isActive,
        category: s.category,
        monthlyEquivalent: s.amount,
      })),
    },
  });
}
