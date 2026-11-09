import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaDebtRepository } from "../PrismaDebtRepository";
import { DebtStatus, DebtType } from "../../../finance/debt/Debt";
import { Frequency } from "../../../finance/types/Frequency";

const mockDb = {
  debt: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
};

const repo = new PrismaDebtRepository(mockDb as any);

const baseRow = {
  id: "d1",
  userId: "u1",
  name: "Home Loan",
  type: "HOME_LOAN",
  principalAmount: 5000000,
  currentBalance: 4200000,
  currency: "INR",
  interestRate: 8.5,
  emiAmount: 42000,
  emiDate: 5,
  lender: "HDFC Bank",
  isActive: true,
  startDate: new Date("2022-01-05"),
  projectedEndDate: new Date("2042-01-05"),
  createdAt: new Date("2022-01-05"),
};

beforeEach(() => vi.clearAllMocks());

describe("PrismaDebtRepository — mapping", () => {
  it("maps DB HOME_LOAN to domain HOME_LOAN", async () => {
    mockDb.debt.findMany.mockResolvedValue([baseRow]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.type).toBe(DebtType.HOME_LOAN);
  });

  it("maps DB BNPL to domain BUY_NOW_PAY_LATER", async () => {
    mockDb.debt.findMany.mockResolvedValue([{ ...baseRow, type: "BNPL" }]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.type).toBe(DebtType.BUY_NOW_PAY_LATER);
  });

  it("maps money fields to Money objects", async () => {
    mockDb.debt.findMany.mockResolvedValue([baseRow]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.principalOriginal).toEqual({ amount: 5000000, currency: "INR" });
    expect(debt!.principalOutstanding).toEqual({ amount: 4200000, currency: "INR" });
    expect(debt!.minimumPayment).toEqual({ amount: 42000, currency: "INR" });
  });

  it("defaults payment frequency to MONTHLY", async () => {
    mockDb.debt.findMany.mockResolvedValue([baseRow]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.paymentFrequency).toBe(Frequency.MONTHLY);
  });

  it("sets status ACTIVE when isActive=true", async () => {
    mockDb.debt.findMany.mockResolvedValue([baseRow]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.status).toBe(DebtStatus.ACTIVE);
  });

  it("sets status CLOSED when isActive=false", async () => {
    mockDb.debt.findMany.mockResolvedValue([{ ...baseRow, isActive: false }]);
    const [debt] = await repo.findByUser("u1");
    expect(debt!.status).toBe(DebtStatus.CLOSED);
  });
});

describe("PrismaDebtRepository — nullable field defaults", () => {
  it("defaults interestRate to 0 when null", async () => {
    mockDb.debt.findMany.mockResolvedValue([{ ...baseRow, interestRate: null }]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.interestRate).toBe(0);
  });

  it("defaults lender to 'Unknown' when null", async () => {
    mockDb.debt.findMany.mockResolvedValue([{ ...baseRow, lender: null }]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.lender).toBe("Unknown");
  });

  it("defaults minimumPayment to 0 when emiAmount null", async () => {
    mockDb.debt.findMany.mockResolvedValue([{ ...baseRow, emiAmount: null }]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.minimumPayment.amount).toBe(0);
  });

  it("synthesizes dueDate from emiDate when present", async () => {
    mockDb.debt.findMany.mockResolvedValue([baseRow]); // emiDate: 5
    const [debt] = await repo.findActive("u1");
    // Verify local day-of-month equals the emiDate (timezone-agnostic check)
    const localDay = new Date(debt!.dueDate).getDate();
    expect(localDay).toBe(5);
  });

  it("falls back to createdAt for dueDate when emiDate null", async () => {
    mockDb.debt.findMany.mockResolvedValue([{ ...baseRow, emiDate: null }]);
    const [debt] = await repo.findActive("u1");
    expect(debt!.dueDate).toBe(baseRow.createdAt.toISOString());
  });
});

describe("PrismaDebtRepository — findById()", () => {
  it("returns null when not found", async () => {
    mockDb.debt.findFirst.mockResolvedValue(null);
    const result = await repo.findById("u1", "nonexistent");
    expect(result).toBeNull();
  });

  it("returns Debt when found", async () => {
    mockDb.debt.findFirst.mockResolvedValue(baseRow);
    const result = await repo.findById("u1", "d1");
    expect(result?.id).toBe("d1");
  });
});
