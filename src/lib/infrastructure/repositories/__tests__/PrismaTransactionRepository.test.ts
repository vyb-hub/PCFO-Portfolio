import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaTransactionRepository } from "../PrismaTransactionRepository";

const mockDb = {
  transaction: {
    findMany: vi.fn(),
  },
};

const repo = new PrismaTransactionRepository(mockDb as any);

const baseRow = {
  id: "t1",
  userId: "u1",
  amount: 1500,
  currency: "INR",
  type: "DEBIT" as const,
  category: "food",
  subcategory: "restaurants",
  description: "Dinner",
  merchant: "Swiggy",
  account: "HDFC-1234",
  date: new Date("2026-06-15"),
  isRecurring: false,
  recurringId: null,
};

beforeEach(() => vi.clearAllMocks());

describe("PrismaTransactionRepository — findByPeriod()", () => {
  it("excludes ignored transactions", async () => {
    mockDb.transaction.findMany.mockResolvedValue([baseRow]);
    const period = { start: new Date("2026-06-01"), end: new Date("2026-06-30") };
    const result = await repo.findByPeriod("u1", period);

    expect(mockDb.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ignored: false }) }),
    );
    expect(result).toHaveLength(1);
  });

  it("maps DB row to TransactionRecord", async () => {
    mockDb.transaction.findMany.mockResolvedValue([baseRow]);
    const period = { start: new Date("2026-06-01"), end: new Date("2026-06-30") };
    const [record] = await repo.findByPeriod("u1", period);

    expect(record!.id).toBe("t1");
    expect(record!.amount).toEqual({ amount: 1500, currency: "INR" });
    expect(record!.type).toBe("DEBIT");
    expect(record!.merchant).toBe("Swiggy");
  });

  it("returns empty array when no transactions", async () => {
    mockDb.transaction.findMany.mockResolvedValue([]);
    const result = await repo.findByPeriod("u1", { start: new Date(), end: new Date() });
    expect(result).toHaveLength(0);
  });
});

describe("PrismaTransactionRepository — findByCategory()", () => {
  it("passes category filter to query", async () => {
    mockDb.transaction.findMany.mockResolvedValue([]);
    await repo.findByCategory("u1", "food");
    expect(mockDb.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ category: "food" }) }),
    );
  });

  it("includes period filter when provided", async () => {
    mockDb.transaction.findMany.mockResolvedValue([]);
    const period = { start: new Date("2026-06-01"), end: new Date("2026-06-30") };
    await repo.findByCategory("u1", "food", period);
    expect(mockDb.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: { gte: period.start, lte: period.end },
        }),
      }),
    );
  });
});

describe("PrismaTransactionRepository — findRecurring()", () => {
  it("filters for isRecurring = true", async () => {
    mockDb.transaction.findMany.mockResolvedValue([]);
    await repo.findRecurring("u1");
    expect(mockDb.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isRecurring: true }) }),
    );
  });
});

describe("PrismaTransactionRepository — findRecent()", () => {
  it("passes take limit to query", async () => {
    mockDb.transaction.findMany.mockResolvedValue([]);
    await repo.findRecent("u1", 10);
    expect(mockDb.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});
