import type { IInvestmentRepository } from "../../finance/investments/IInvestmentRepository";
import type { Investment, InvestmentStatus } from "../../finance/investments/Investment";

/**
 * Stub implementation — no Investment model exists in the Prisma schema (EC-010 calibration finding #1).
 *
 * All methods return empty arrays. Net worth will be negative (= -total_debt)
 * until an Investment table is added in a future milestone.
 *
 * See: src/lib/finance/pipeline/CALIBRATION_NOTES.md
 */
export class PrismaInvestmentRepository implements IInvestmentRepository {
  async findByUser(_userId: string): Promise<ReadonlyArray<Investment>> {
    return [];
  }

  async findActive(_userId: string): Promise<ReadonlyArray<Investment>> {
    return [];
  }

  async findByStatus(
    _userId: string,
    _status: InvestmentStatus,
  ): Promise<ReadonlyArray<Investment>> {
    return [];
  }

  async findById(_userId: string, _investmentId: string): Promise<Investment | null> {
    return null;
  }
}
