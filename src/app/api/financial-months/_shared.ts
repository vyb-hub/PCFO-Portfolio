import { db } from "@/lib/db/prisma";
import { createDefaultFinancialMonthClosingService } from "@/lib/finance/financial-closing";
import type { FinancialMonth } from "@/lib/finance/financial-closing";
import { ChecklistItemStatus, RequiredStatementType } from "@/lib/finance/financial-closing";
import { createDefaultTelegramDelivery } from "@/lib/telegram/telegramDelivery";
import type { StatementAccountType } from "@prisma/client";

/** Not a route — a shared helper for the financial-months/* route handlers
 * (Next.js only treats files literally named route.ts as routes). */

export function getClosingService() {
  return createDefaultFinancialMonthClosingService(db, createDefaultTelegramDelivery());
}

/** Date -> ISO string, recursively — same technique as /api/finance/pipeline/route.ts. */
export function serializeForTransport(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, v) => (v instanceof Date ? v.toISOString() : v))) as unknown;
}

/** Salary counts as one more "slot" alongside the checklist items. */
export function completionPercent(month: FinancialMonth): number {
  const total = month.checklistItems.length + 1;
  const satisfied =
    month.checklistItems.filter(i => i.status === ChecklistItemStatus.SATISFIED).length +
    (month.salaryConfirmed ? 1 : 0);
  return Math.round((satisfied / total) * 100);
}

/** Prisma's StatementAccountType (auto-detected on upload) -> the domain's
 * RequiredStatementType (what a checklist item tracks). SALARY has no
 * checklist analogue — salary is confirmed separately, not via an uploaded
 * statement match (see ADR-021) — so it maps to null (no suggestion). */
export function mapStatementAccountType(accountType: StatementAccountType | null): RequiredStatementType | null {
  switch (accountType) {
    case "SAVINGS":
    case "CURRENT":
      return RequiredStatementType.BANK;
    case "CREDIT_CARD":
      return RequiredStatementType.CREDIT_CARD;
    case "LOAN":
      return RequiredStatementType.LOAN;
    case "INVESTMENT":
      return RequiredStatementType.INVESTMENT;
    default:
      return null;
  }
}
