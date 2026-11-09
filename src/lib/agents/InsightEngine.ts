import { completeJSON } from "@/lib/ai/claude";
import { INSIGHT_SYSTEM, ANOMALY_SYSTEM } from "@/lib/ai/prompts";
import { db } from "@/lib/db/prisma";
import type { InsightType, InsightSeverity } from "@/types";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

interface RawInsight {
  type: InsightType;
  title: string;
  body: string;
  severity: InsightSeverity;
  period?: string;
}

interface AnomalyFlag {
  transactionId: string;
  reason: string;
  severity: "WARNING" | "ALERT";
}

export class InsightEngine {
  async generateMonthlyInsights(
    userId: string,
    targetDate: Date = new Date()
  ): Promise<number> {
    const period = format(targetDate, "yyyy-MM");
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);
    const prevStart = startOfMonth(subMonths(targetDate, 1));
    const prevEnd = endOfMonth(subMonths(targetDate, 1));

    // Gather data for AI context
    const [currentTxns, prevTxns, subscriptions] = await Promise.all([
      db.transaction.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: "desc" },
      }),
      db.transaction.findMany({
        where: { userId, date: { gte: prevStart, lte: prevEnd } },
      }),
      db.subscription.findMany({
        where: { userId, isActive: true },
      }),
    ]);

    const categoryTotals = aggregateByCategory(currentTxns);
    const prevCategoryTotals = aggregateByCategory(prevTxns);

    const context = buildInsightContext(
      period,
      categoryTotals,
      prevCategoryTotals,
      currentTxns,
      subscriptions
    );

    const insights = await completeJSON<RawInsight[]>(INSIGHT_SYSTEM, context, {
      maxTokens: 3000,
    });

    let created = 0;
    for (const insight of insights.slice(0, 10)) {
      // Avoid duplicate insights for same period + type
      const exists = await db.insight.findFirst({
        where: { userId, type: insight.type, period, dismissed: false },
      });
      if (exists) continue;

      await db.insight.create({
        data: {
          userId,
          type: insight.type,
          title: insight.title,
          body: insight.body,
          severity: insight.severity,
          period,
          metadata: {},
        },
      });
      created++;
    }

    return created;
  }

  async detectAnomalies(
    userId: string,
    transactionIds: string[]
  ): Promise<void> {
    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionIds }, userId },
    });

    if (transactions.length === 0) return;

    // Get historical averages by category
    const avgByCategory = await db.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        type: "DEBIT",
        date: { gte: subMonths(new Date(), 3) },
      },
      _avg: { amount: true },
    });

    const context = JSON.stringify({
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        category: t.category,
        merchant: t.merchant,
        date: t.date.toISOString(),
        type: t.type,
      })),
      categoryAverages: avgByCategory,
    });

    const anomalies = await completeJSON<AnomalyFlag[]>(
      ANOMALY_SYSTEM,
      context
    );

    for (const anomaly of anomalies) {
      await db.insight.create({
        data: {
          userId,
          type: "UNUSUAL_TRANSACTION",
          title: "Unusual Transaction Detected",
          body: anomaly.reason,
          severity: anomaly.severity,
          period: format(new Date(), "yyyy-MM"),
          metadata: { transactionId: anomaly.transactionId } as never,
        },
      });
    }
  }

  async generateSubscriptionInsights(userId: string): Promise<void> {
    const subscriptions = await db.subscription.findMany({
      where: { userId },
    });

    const transactions = await db.transaction.findMany({
      where: { userId, category: "subscriptions" },
      orderBy: { date: "desc" },
      take: 50,
    });

    const inactiveCount = subscriptions.filter((s) => !s.isActive).length;
    const monthlyTotal = subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.frequency), 0);

    if (inactiveCount >= 2) {
      const exists = await db.insight.findFirst({
        where: {
          userId,
          type: "SUBSCRIPTION_INACTIVE",
          createdAt: { gte: subMonths(new Date(), 1) },
          dismissed: false,
        },
      });

      if (!exists) {
        await db.insight.create({
          data: {
            userId,
            type: "SUBSCRIPTION_INACTIVE",
            title: `${inactiveCount} Inactive Subscriptions Still Charging`,
            body: `${inactiveCount} subscriptions appear inactive based on usage patterns but continue billing ₹${monthlyTotal.toFixed(0)}/month combined. The digital leech kingdom remains operational.`,
            severity: "WARNING",
            period: format(new Date(), "yyyy-MM"),
            metadata: { inactiveCount, monthlyTotal } as never,
          },
        });
      }
    }

    // Subscription creep detection
    void transactions; // used for future creep analysis
  }
}

// ── Helpers ────────────────────────────────────────────────────

function aggregateByCategory(
  transactions: Array<{ category: string; amount: number; type: string }>
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "DEBIT") {
      totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
    }
  }
  return totals;
}

function buildInsightContext(
  period: string,
  current: Record<string, number>,
  prev: Record<string, number>,
  transactions: Array<{ amount: number; type: string; date: Date; category: string; merchant: string | null }>,
  subscriptions: Array<{ name: string; amount: number; frequency: string; isActive: boolean }>
): string {
  const totalExpenses = Object.values(current).reduce((a, b) => a + b, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((a, t) => a + t.amount, 0);

  const trends = Object.entries(current).map(([cat, amount]) => ({
    category: cat,
    currentAmount: amount,
    previousAmount: prev[cat] ?? 0,
    changePercent: prev[cat]
      ? Math.round(((amount - prev[cat]!) / prev[cat]!) * 100)
      : null,
  }));

  return JSON.stringify({
    period,
    totalExpenses,
    totalIncome,
    savingsRate: totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : null,
    categoryTrends: trends,
    topMerchants: getTopMerchants(transactions),
    subscriptions: subscriptions.map((s) => ({
      name: s.name,
      amount: s.amount,
      frequency: s.frequency,
      isActive: s.isActive,
    })),
    transactionCount: transactions.length,
    lateNightSpend: transactions
      .filter((t) => {
        const h = t.date.getHours();
        return h >= 22 || h <= 4;
      })
      .reduce((a, t) => a + t.amount, 0),
  });
}

function getTopMerchants(
  transactions: Array<{ merchant: string | null; amount: number; type: string }>
): Array<{ merchant: string; total: number }> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "DEBIT" && tx.merchant) {
      totals[tx.merchant] = (totals[tx.merchant] ?? 0) + tx.amount;
    }
  }
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([merchant, total]) => ({ merchant, total }));
}

function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case "WEEKLY": return amount * 4.33;
    case "QUARTERLY": return amount / 3;
    case "YEARLY": return amount / 12;
    default: return amount;
  }
}
