import type { Goal, GoalStatus } from "./Goal";

/**
 * Port: goal data access.
 * Implementations live outside the finance domain (e.g., PrismaGoalRepository).
 */
export interface IGoalRepository {
  findByUser(userId: string): Promise<ReadonlyArray<Goal>>;
  findActive(userId: string): Promise<ReadonlyArray<Goal>>;
  findByStatus(userId: string, status: GoalStatus): Promise<ReadonlyArray<Goal>>;
  findById(userId: string, goalId: string): Promise<Goal | null>;
}
