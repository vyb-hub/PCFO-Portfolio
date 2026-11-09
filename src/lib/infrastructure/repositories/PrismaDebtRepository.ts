import type { PrismaClient } from "@prisma/client";
import type { IDebtRepository } from "../../finance/debt/IDebtRepository";
import { Debt, DebtStatus, DebtType } from "../../finance/debt/Debt";
import { Frequency } from "../../finance/types/Frequency";

// DB DebtType → Domain DebtType
// Prisma: HOME_LOAN | CAR_LOAN | PERSONAL_LOAN | CREDIT_CARD | EDUCATION_LOAN | BNPL | OTHER
// Domain: HOME_LOAN | CAR_LOAN | PERSONAL_LOAN | CREDIT_CARD | EDUCATION_LOAN | BUSINESS_LOAN | BUY_NOW_PAY_LATER | OTHER
const DB_DEBT_TYPE_MAP: Record<string, DebtType> = {
  HOME_LOAN:       DebtType.HOME_LOAN,
  CAR_LOAN:        DebtType.CAR_LOAN,
  PERSONAL_LOAN:   DebtType.PERSONAL_LOAN,
  CREDIT_CARD:     DebtType.CREDIT_CARD,
  EDUCATION_LOAN:  DebtType.EDUCATION_LOAN,
  BNPL:            DebtType.BUY_NOW_PAY_LATER,
  OTHER:           DebtType.OTHER,
};

export class PrismaDebtRepository implements IDebtRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUser(userId: string): Promise<ReadonlyArray<Debt>> {
    const rows = await this.db.debt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDebt);
  }

  async findActive(userId: string): Promise<ReadonlyArray<Debt>> {
    const rows = await this.db.debt.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDebt);
  }

  async findByStatus(userId: string, status: DebtStatus): Promise<ReadonlyArray<Debt>> {
    const isActive = status === DebtStatus.ACTIVE;
    const rows = await this.db.debt.findMany({
      where: { userId, isActive },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDebt).filter((d) => d.status === status);
  }

  async findById(userId: string, debtId: string): Promise<Debt | null> {
    const row = await this.db.debt.findFirst({ where: { id: debtId, userId } });
    return row ? toDebt(row) : null;
  }
}

function toDebt(row: {
  id: string;
  userId: string;
  name: string;
  type: string;
  principalAmount: number;
  currentBalance: number;
  currency: string;
  interestRate: number | null;
  emiAmount: number | null;
  emiDate: number | null;
  lender: string | null;
  isActive: boolean;
  startDate: Date | null;
  projectedEndDate: Date | null;
  createdAt: Date;
}): Debt {
  const currency = row.currency;

  // Derive dueDate from emiDate (day-of-month) using next month
  const dueDate = row.emiDate
    ? nextDueDateFromDay(row.emiDate)
    : row.createdAt.toISOString();

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: DB_DEBT_TYPE_MAP[row.type] ?? DebtType.OTHER,
    lender: row.lender ?? "Unknown",
    principalOriginal: { amount: row.principalAmount, currency },
    principalOutstanding: { amount: row.currentBalance, currency },
    interestRate: row.interestRate ?? 0,
    minimumPayment: { amount: row.emiAmount ?? 0, currency },
    paymentFrequency: Frequency.MONTHLY,
    dueDate,
    startDate: row.startDate ? row.startDate.toISOString() : row.createdAt.toISOString(),
    endDate: row.projectedEndDate ? row.projectedEndDate.toISOString() : undefined,
    status: row.isActive ? DebtStatus.ACTIVE : DebtStatus.CLOSED,
  };
}

/** Returns ISO string for the next occurrence of a specific day-of-month (1–28). */
function nextDueDateFromDay(dayOfMonth: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const safeDay = Math.min(dayOfMonth, 28);

  const thisMonth = new Date(year, month, safeDay);
  if (thisMonth.getTime() > now.getTime()) {
    return thisMonth.toISOString();
  }
  // Roll forward one month
  const nextMonth = new Date(year, month + 1, safeDay);
  return nextMonth.toISOString();
}
