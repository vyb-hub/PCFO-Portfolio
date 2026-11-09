import type { PrismaClient } from "@prisma/client";
import type { IRecurringPaymentRepository } from "../../finance/aggregation/IRecurringPaymentRepository";
import type { RecurringPayment } from "../../finance/aggregation/RecurringPayment";
import { Frequency } from "../../finance/types/Frequency";

// DB SubscriptionFreq → Domain Frequency
// DB: DAILY | WEEKLY | MONTHLY | QUARTERLY | YEARLY
// Domain: DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUALLY | IRREGULAR
const DB_FREQ_MAP: Record<string, Frequency> = {
  DAILY:     Frequency.DAILY,
  WEEKLY:    Frequency.WEEKLY,
  MONTHLY:   Frequency.MONTHLY,
  QUARTERLY: Frequency.QUARTERLY,
  YEARLY:    Frequency.ANNUALLY,
};

export class PrismaRecurringPaymentRepository implements IRecurringPaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUser(userId: string): Promise<ReadonlyArray<RecurringPayment>> {
    const [subscriptions, mandates] = await Promise.all([
      this.db.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      this.db.mandate.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return [
      ...subscriptions.map(subscriptionToRecurringPayment),
      ...mandates.map(mandateToRecurringPayment),
    ];
  }

  async findActive(userId: string): Promise<ReadonlyArray<RecurringPayment>> {
    const [subscriptions, mandates] = await Promise.all([
      this.db.subscription.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      this.db.mandate.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return [
      ...subscriptions.map(subscriptionToRecurringPayment),
      ...mandates.map(mandateToRecurringPayment),
    ];
  }
}

function subscriptionToRecurringPayment(row: {
  id: string;
  userId: string;
  name: string;
  merchant: string | null;
  amount: number;
  currency: string;
  frequency: string;
  nextDueDate: Date | null;
  startDate: Date | null;
  isActive: boolean;
  category: string;
}): RecurringPayment {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    merchant: row.merchant,
    amount: { amount: row.amount, currency: row.currency },
    frequency: DB_FREQ_MAP[row.frequency] ?? Frequency.MONTHLY,
    nextDueDate: row.nextDueDate,
    isActive: row.isActive,
    category: row.category,
    startedAt: row.startDate,
  };
}

function mandateToRecurringPayment(row: {
  id: string;
  userId: string;
  merchant: string;
  amount: number | null;
  mandateLimit: number;
  currency: string;
  frequency: string;
  nextDebitDate: Date | null;
  createdDate: Date | null;
  status: string;
}): RecurringPayment {
  return {
    id: row.id,
    userId: row.userId,
    name: `${row.merchant} mandate`,
    merchant: row.merchant,
    // Use actual amount if known; fall back to mandateLimit
    amount: { amount: row.amount ?? row.mandateLimit, currency: row.currency },
    frequency: DB_FREQ_MAP[row.frequency] ?? Frequency.MONTHLY,
    nextDueDate: row.nextDebitDate,
    isActive: row.status === "ACTIVE",
    category: "mandates",
    startedAt: row.createdDate,
  };
}
