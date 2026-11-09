import type { Investment, InvestmentStatus } from "./Investment";

/**
 * Port: investment data access.
 * Implementations live outside the finance domain (e.g., PrismaInvestmentRepository).
 */
export interface IInvestmentRepository {
  findByUser(userId: string): Promise<ReadonlyArray<Investment>>;
  findActive(userId: string): Promise<ReadonlyArray<Investment>>;
  findByStatus(userId: string, status: InvestmentStatus): Promise<ReadonlyArray<Investment>>;
  findById(userId: string, investmentId: string): Promise<Investment | null>;
}
