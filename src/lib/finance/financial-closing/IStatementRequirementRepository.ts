import type { StatementRequirement } from "./StatementRequirement";

/**
 * Port: UserStatementRequirement data access.
 * Implementation lives outside the finance domain (PrismaStatementRequirementRepository).
 */
export interface IStatementRequirementRepository {
  listActive(userId: string): Promise<ReadonlyArray<StatementRequirement>>;
  create(requirement: Omit<StatementRequirement, "id">): Promise<StatementRequirement>;
  deactivate(userId: string, requirementId: string): Promise<void>;
  findByLinkedDebt(userId: string, debtId: string): Promise<StatementRequirement | null>;
}
