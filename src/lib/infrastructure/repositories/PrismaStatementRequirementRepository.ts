import type { PrismaClient } from "@prisma/client";
import type { IStatementRequirementRepository } from "../../finance/financial-closing/IStatementRequirementRepository";
import type { StatementRequirement } from "../../finance/financial-closing/StatementRequirement";
import { RequiredStatementType } from "../../finance/financial-closing/RequiredStatementType";

export class PrismaStatementRequirementRepository implements IStatementRequirementRepository {
  constructor(private readonly db: PrismaClient) {}

  async listActive(userId: string): Promise<ReadonlyArray<StatementRequirement>> {
    const rows = await this.db.userStatementRequirement.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toStatementRequirement);
  }

  async create(requirement: Omit<StatementRequirement, "id">): Promise<StatementRequirement> {
    const row = await this.db.userStatementRequirement.create({
      data: {
        userId: requirement.userId,
        label: requirement.label,
        statementType: requirement.statementType,
        linkedDebtId: requirement.linkedDebtId,
        autoManaged: requirement.autoManaged,
        isActive: requirement.isActive,
      },
    });
    return toStatementRequirement(row);
  }

  async deactivate(userId: string, requirementId: string): Promise<void> {
    await this.db.userStatementRequirement.updateMany({
      where: { id: requirementId, userId },
      data: { isActive: false },
    });
  }

  async findByLinkedDebt(userId: string, debtId: string): Promise<StatementRequirement | null> {
    const row = await this.db.userStatementRequirement.findFirst({ where: { userId, linkedDebtId: debtId } });
    return row ? toStatementRequirement(row) : null;
  }
}

function toStatementRequirement(row: {
  id: string;
  userId: string;
  label: string;
  statementType: string;
  linkedDebtId: string | null;
  autoManaged: boolean;
  isActive: boolean;
}): StatementRequirement {
  return {
    id: row.id,
    userId: row.userId,
    label: row.label,
    statementType: row.statementType as RequiredStatementType,
    linkedDebtId: row.linkedDebtId,
    autoManaged: row.autoManaged,
    isActive: row.isActive,
  };
}
