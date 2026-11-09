import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaGoalRepository } from "../PrismaGoalRepository";
import { GoalStatus, GoalType } from "../../../finance/goals/Goal";
import { Frequency } from "../../../finance/types/Frequency";

const mockDb = {
  goal: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
};

const repo = new PrismaGoalRepository(mockDb as any);

const baseRow = {
  id: "g1",
  userId: "u1",
  type: "EMERGENCY_FUND",
  name: "Emergency Fund",
  targetAmount: 500000,
  currentAmount: 125000,
  currency: "INR",
  targetDate: new Date("2026-12-31"),
  isActive: true,
  isPrimary: false,
  notes: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-06-01"),
};

beforeEach(() => vi.clearAllMocks());

describe("PrismaGoalRepository — GoalType mapping", () => {
  it("maps EMERGENCY_FUND → GoalType.EMERGENCY_FUND", async () => {
    mockDb.goal.findMany.mockResolvedValue([baseRow]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.type).toBe(GoalType.EMERGENCY_FUND);
  });

  it("maps SAVINGS_RESERVE → GoalType.CUSTOM", async () => {
    mockDb.goal.findMany.mockResolvedValue([{ ...baseRow, type: "SAVINGS_RESERVE" }]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.type).toBe(GoalType.CUSTOM);
  });

  it("maps INVESTMENT → GoalType.CUSTOM", async () => {
    mockDb.goal.findMany.mockResolvedValue([{ ...baseRow, type: "INVESTMENT" }]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.type).toBe(GoalType.CUSTOM);
  });
});

describe("PrismaGoalRepository — status derivation", () => {
  it("inactive goal → ABANDONED", async () => {
    mockDb.goal.findMany.mockResolvedValue([{ ...baseRow, isActive: false }]);
    const [goal] = await repo.findByUser("u1");
    expect(goal!.status).toBe(GoalStatus.ABANDONED);
  });

  it("100% progress → ACHIEVED", async () => {
    mockDb.goal.findMany.mockResolvedValue([
      { ...baseRow, currentAmount: 500000, targetAmount: 500000 },
    ]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.status).toBe(GoalStatus.ACHIEVED);
  });

  it("75% progress → ON_TRACK", async () => {
    mockDb.goal.findMany.mockResolvedValue([
      { ...baseRow, currentAmount: 375000, targetAmount: 500000 },
    ]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.status).toBe(GoalStatus.ON_TRACK);
  });

  it("25% progress → IN_PROGRESS", async () => {
    mockDb.goal.findMany.mockResolvedValue([
      { ...baseRow, currentAmount: 125000, targetAmount: 500000 },
    ]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.status).toBe(GoalStatus.IN_PROGRESS);
  });

  it("0% progress → NOT_STARTED", async () => {
    mockDb.goal.findMany.mockResolvedValue([
      { ...baseRow, currentAmount: 0, targetAmount: 500000 },
    ]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.status).toBe(GoalStatus.NOT_STARTED);
  });
});

describe("PrismaGoalRepository — priority derivation", () => {
  it("isPrimary=true → priority 1", async () => {
    mockDb.goal.findMany.mockResolvedValue([{ ...baseRow, isPrimary: true }]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.priority).toBe(1);
  });

  it("non-primary goals get index-based priority", async () => {
    mockDb.goal.findMany.mockResolvedValue([
      { ...baseRow, id: "g1", isPrimary: false },
      { ...baseRow, id: "g2", isPrimary: false },
    ]);
    const goals = await repo.findActive("u1");
    expect(goals[0]!.priority).toBe(1);
    expect(goals[1]!.priority).toBe(2);
  });
});

describe("PrismaGoalRepository — derived defaults", () => {
  it("defaults contributionFrequency to MONTHLY", async () => {
    mockDb.goal.findMany.mockResolvedValue([baseRow]);
    const [goal] = await repo.findActive("u1");
    expect(goal!.contributionFrequency).toBe(Frequency.MONTHLY);
  });

  it("defaults targetDate to ~1 year when null", async () => {
    mockDb.goal.findMany.mockResolvedValue([{ ...baseRow, targetDate: null }]);
    const [goal] = await repo.findActive("u1");
    const targetYear = new Date(goal!.targetDate).getFullYear();
    const currentYear = new Date().getFullYear();
    expect(targetYear).toBeGreaterThanOrEqual(currentYear);
  });
});
