import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaRecurringPaymentRepository } from "../PrismaRecurringPaymentRepository";
import { Frequency } from "../../../finance/types/Frequency";

const mockDb = {
  subscription: { findMany: vi.fn() },
  mandate:      { findMany: vi.fn() },
};

const repo = new PrismaRecurringPaymentRepository(mockDb as any);

const baseSubscription = {
  id: "s1",
  userId: "u1",
  name: "Netflix",
  merchant: "Netflix",
  amount: 649,
  currency: "INR",
  frequency: "MONTHLY",
  nextDueDate: new Date("2026-07-01"),
  startDate: new Date("2024-01-01"),
  isActive: true,
  category: "subscriptions",
};

const baseMandate = {
  id: "m1",
  userId: "u1",
  merchant: "LIC",
  amount: 5000,
  mandateLimit: 10000,
  currency: "INR",
  frequency: "MONTHLY",
  nextDebitDate: new Date("2026-07-05"),
  createdDate: new Date("2023-01-05"),
  status: "ACTIVE",
};

beforeEach(() => vi.clearAllMocks());

describe("PrismaRecurringPaymentRepository — findActive()", () => {
  it("maps subscription to RecurringPayment", async () => {
    mockDb.subscription.findMany.mockResolvedValue([baseSubscription]);
    mockDb.mandate.findMany.mockResolvedValue([]);
    const [payment] = await repo.findActive("u1");

    expect(payment!.id).toBe("s1");
    expect(payment!.name).toBe("Netflix");
    expect(payment!.amount).toEqual({ amount: 649, currency: "INR" });
    expect(payment!.frequency).toBe(Frequency.MONTHLY);
    expect(payment!.isActive).toBe(true);
  });

  it("maps mandate to RecurringPayment using actual amount", async () => {
    mockDb.subscription.findMany.mockResolvedValue([]);
    mockDb.mandate.findMany.mockResolvedValue([baseMandate]);
    const [payment] = await repo.findActive("u1");

    expect(payment!.amount).toEqual({ amount: 5000, currency: "INR" });
  });

  it("falls back to mandateLimit when amount is null", async () => {
    mockDb.subscription.findMany.mockResolvedValue([]);
    mockDb.mandate.findMany.mockResolvedValue([{ ...baseMandate, amount: null }]);
    const [payment] = await repo.findActive("u1");

    expect(payment!.amount).toEqual({ amount: 10000, currency: "INR" });
  });

  it("maps DB YEARLY frequency to domain ANNUALLY", async () => {
    mockDb.subscription.findMany.mockResolvedValue([
      { ...baseSubscription, frequency: "YEARLY" },
    ]);
    mockDb.mandate.findMany.mockResolvedValue([]);
    const [payment] = await repo.findActive("u1");

    expect(payment!.frequency).toBe(Frequency.ANNUALLY);
  });

  it("combines subscriptions and mandates", async () => {
    mockDb.subscription.findMany.mockResolvedValue([baseSubscription]);
    mockDb.mandate.findMany.mockResolvedValue([baseMandate]);
    const payments = await repo.findActive("u1");

    expect(payments).toHaveLength(2);
  });
});
