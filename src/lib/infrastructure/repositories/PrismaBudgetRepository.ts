import type { PrismaClient } from "@prisma/client";
import type { IBudgetRepository } from "../../finance/aggregation/IBudgetRepository";
import type { BudgetRecord } from "../../finance/aggregation/BudgetRecord";
import type { AggregatePeriod } from "../../finance/aggregation/AggregatePeriod";
import { AggregateGranularity } from "../../finance/aggregation/AggregatePeriod";

export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUser(userId: string): Promise<ReadonlyArray<BudgetRecord>> {
    const rows = await this.db.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toBudgetRecord);
  }

  async findActive(userId: string): Promise<ReadonlyArray<BudgetRecord>> {
    const rows = await this.db.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toBudgetRecord);
  }

  async findByPeriod(
    userId: string,
    period: AggregatePeriod,
  ): Promise<ReadonlyArray<BudgetRecord>> {
    const rows = await this.db.budget.findMany({
      where: {
        userId,
        startDate: { lte: period.range.end },
        OR: [
          { endDate: null },
          { endDate: { gte: period.range.start } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toBudgetRecord);
  }

  async findByCategory(userId: string, category: string): Promise<ReadonlyArray<BudgetRecord>> {
    const rows = await this.db.budget.findMany({
      where: { userId, category },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toBudgetRecord);
  }
}

function toBudgetRecord(row: {
  id: string;
  userId: string;
  category: string;
  amount: number;
  currency: string;
  period: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}): BudgetRecord {
  const granularity = DB_PERIOD_TO_GRANULARITY[row.period] ?? AggregateGranularity.MONTHLY;
  const { start, end } = periodRange(row.startDate, row.period);

  return {
    id: row.id,
    userId: row.userId,
    category: row.category,
    budgetedAmount: { amount: row.amount, currency: row.currency },
    period: {
      range: { start, end },
      label: periodLabel(row.startDate, row.period),
      granularity,
    },
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

const DB_PERIOD_TO_GRANULARITY: Record<string, AggregateGranularity> = {
  DAILY:     AggregateGranularity.DAILY,
  WEEKLY:    AggregateGranularity.WEEKLY,
  MONTHLY:   AggregateGranularity.MONTHLY,
  QUARTERLY: AggregateGranularity.QUARTERLY,
  YEARLY:    AggregateGranularity.ANNUAL,
};

function periodRange(startDate: Date, period: string): { start: Date; end: Date } {
  const start = new Date(startDate);
  const end = new Date(startDate);

  switch (period) {
    case "DAILY":
      end.setDate(end.getDate() + 1);
      break;
    case "WEEKLY":
      end.setDate(end.getDate() + 7);
      break;
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3);
      break;
    case "YEARLY":
      end.setFullYear(end.getFullYear() + 1);
      break;
    case "MONTHLY":
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }

  return { start, end };
}

function periodLabel(startDate: Date, period: string): string {
  const y = startDate.getFullYear();
  const m = String(startDate.getMonth() + 1).padStart(2, "0");

  switch (period) {
    case "DAILY":    return `${y}-${m}-${String(startDate.getDate()).padStart(2, "0")}`;
    case "WEEKLY":   return `${y}-W${weekNumber(startDate)}`;
    case "QUARTERLY": {
      const q = Math.ceil((startDate.getMonth() + 1) / 3);
      return `Q${q} ${y}`;
    }
    case "YEARLY":   return `FY ${y}`;
    case "MONTHLY":
    default:         return `${y}-${m}`;
  }
}

function weekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return String(week).padStart(2, "0");
}
