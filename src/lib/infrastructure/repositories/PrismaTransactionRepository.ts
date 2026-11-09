import type { PrismaClient } from "@prisma/client";
import type { ITransactionRepository } from "../../finance/types/ITransactionRepository";
import type { TransactionRecord, TransactionRecordType } from "../../finance/types/TransactionRecord";
import type { DateRange } from "../../finance/types/DateRange";

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPeriod(userId: string, period: DateRange): Promise<readonly TransactionRecord[]> {
    const rows = await this.db.transaction.findMany({
      where: {
        userId,
        ignored: false,
        date: { gte: period.start, lte: period.end },
      },
      orderBy: { date: "desc" },
    });
    return rows.map(toTransactionRecord);
  }

  async findByCategory(
    userId: string,
    category: string,
    period?: DateRange,
  ): Promise<readonly TransactionRecord[]> {
    const rows = await this.db.transaction.findMany({
      where: {
        userId,
        category,
        ignored: false,
        ...(period ? { date: { gte: period.start, lte: period.end } } : {}),
      },
      orderBy: { date: "desc" },
    });
    return rows.map(toTransactionRecord);
  }

  async findRecurring(userId: string): Promise<readonly TransactionRecord[]> {
    const rows = await this.db.transaction.findMany({
      where: { userId, isRecurring: true, ignored: false },
      orderBy: { date: "desc" },
    });
    return rows.map(toTransactionRecord);
  }

  async findRecent(userId: string, limit: number): Promise<readonly TransactionRecord[]> {
    const rows = await this.db.transaction.findMany({
      where: { userId, ignored: false },
      orderBy: { date: "desc" },
      take: limit,
    });
    return rows.map(toTransactionRecord);
  }
}

function toTransactionRecord(row: {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: "DEBIT" | "CREDIT" | "TRANSFER" | "REFUND";
  category: string;
  subcategory: string | null;
  description: string;
  merchant: string | null;
  account: string | null;
  date: Date;
  isRecurring: boolean;
  recurringId: string | null;
}): TransactionRecord {
  return {
    id: row.id,
    userId: row.userId,
    amount: { amount: row.amount, currency: row.currency },
    type: row.type as TransactionRecordType,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    merchant: row.merchant,
    account: row.account,
    date: row.date,
    isRecurring: row.isRecurring,
    recurringId: row.recurringId,
  };
}
