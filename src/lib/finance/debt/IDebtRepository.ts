import type { Debt, DebtStatus } from "./Debt";

/**
 * Port: debt data access.
 * Implementations live outside the finance domain (e.g., PrismaDebtRepository).
 */
export interface IDebtRepository {
  findByUser(userId: string): Promise<ReadonlyArray<Debt>>;
  findActive(userId: string): Promise<ReadonlyArray<Debt>>;
  findByStatus(userId: string, status: DebtStatus): Promise<ReadonlyArray<Debt>>;
  findById(userId: string, debtId: string): Promise<Debt | null>;
}
