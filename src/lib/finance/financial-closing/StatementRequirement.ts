import type { RequiredStatementType } from "./RequiredStatementType";

/**
 * A user-configured (or Debt-derived) statement the platform expects every
 * month — the template FinancialMonth's checklist items are instantiated
 * from. Not month-scoped itself; `autoManaged`+`linkedDebtId` distinguish
 * requirements synced from an active Debt (loans) from manually configured
 * ones (bank/credit card/investment — no first-class "bank account" model
 * exists to derive those from).
 */
export interface StatementRequirement {
  readonly id: string;
  readonly userId: string;
  readonly label: string;
  readonly statementType: RequiredStatementType;
  readonly linkedDebtId: string | null;
  readonly autoManaged: boolean;
  readonly isActive: boolean;
}
