import type { PrismaClient } from "@prisma/client";
import type { IGoalRepository } from "../../finance/goals/IGoalRepository";
import { Goal, GoalStatus, GoalType } from "../../finance/goals/Goal";
import { Frequency } from "../../finance/types/Frequency";

// DB GoalType → Domain GoalType
// DB: SAVINGS_RESERVE | EMERGENCY_FUND | DEBT_PAYOFF | INVESTMENT | CUSTOM
// Domain: EMERGENCY_FUND | DEBT_PAYOFF | VACATION | HOME_PURCHASE | RETIREMENT | EDUCATION | VEHICLE | CUSTOM
const DB_GOAL_TYPE_MAP: Record<string, GoalType> = {
  SAVINGS_RESERVE: GoalType.CUSTOM,
  EMERGENCY_FUND:  GoalType.EMERGENCY_FUND,
  DEBT_PAYOFF:     GoalType.DEBT_PAYOFF,
  INVESTMENT:      GoalType.CUSTOM,
  CUSTOM:          GoalType.CUSTOM,
};

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUser(userId: string): Promise<ReadonlyArray<Goal>> {
    const rows = await this.db.goal.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return rows.map((row, index) => toGoal(row, index));
  }

  async findActive(userId: string): Promise<ReadonlyArray<Goal>> {
    const rows = await this.db.goal.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return rows.map((row, index) => toGoal(row, index));
  }

  async findByStatus(userId: string, status: GoalStatus): Promise<ReadonlyArray<Goal>> {
    const rows = await this.db.goal.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return rows
      .map((row, index) => toGoal(row, index))
      .filter((g) => g.status === status);
  }

  async findById(userId: string, goalId: string): Promise<Goal | null> {
    const row = await this.db.goal.findFirst({ where: { id: goalId, userId } });
    if (!row) return null;
    const allGoals = await this.db.goal.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const index = allGoals.findIndex((g) => g.id === goalId);
    return toGoal(row, index >= 0 ? index : 0);
  }
}

function toGoal(
  row: {
    id: string;
    userId: string;
    type: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    targetDate: Date | null;
    isActive: boolean;
    isPrimary: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  index: number,
): Goal {
  const currency = row.currency;
  const progress = row.targetAmount > 0 ? row.currentAmount / row.targetAmount : 0;

  // Derive priority from isPrimary + ordering index
  const priority = row.isPrimary ? 1 : index + 1;

  // Derive status from isActive + progress
  const status = deriveGoalStatus(row.isActive, progress);

  // Default targetDate to 1 year from now if not set
  const targetDate = row.targetDate
    ? row.targetDate.toISOString()
    : oneYearFromNow();

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: DB_GOAL_TYPE_MAP[row.type] ?? GoalType.CUSTOM,
    targetAmount: { amount: row.targetAmount, currency },
    currentAmount: { amount: row.currentAmount, currency },
    targetDate,
    priority,
    status,
    contributionFrequency: Frequency.MONTHLY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    description: row.notes ?? undefined,
  };
}

function deriveGoalStatus(isActive: boolean, progress: number): GoalStatus {
  if (!isActive) return GoalStatus.ABANDONED;
  if (progress >= 1) return GoalStatus.ACHIEVED;
  if (progress >= 0.75) return GoalStatus.ON_TRACK;
  if (progress >= 0.25) return GoalStatus.IN_PROGRESS;
  if (progress > 0) return GoalStatus.AT_RISK;
  return GoalStatus.NOT_STARTED;
}

function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
