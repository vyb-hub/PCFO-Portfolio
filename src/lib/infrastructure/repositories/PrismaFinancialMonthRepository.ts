import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { IFinancialMonthRepository } from "../../finance/financial-closing/IFinancialMonthRepository";
import type { FinancialMonth } from "../../finance/financial-closing/FinancialMonth";
import type { ChecklistItem } from "../../finance/financial-closing/ChecklistItem";
import type { ClosingSnapshot } from "../../finance/financial-closing/ClosingSnapshot";
import { FinancialMonthStatus } from "../../finance/financial-closing/FinancialMonthStatus";
import { ChecklistItemStatus } from "../../finance/financial-closing/ChecklistItemStatus";
import { RequiredStatementType } from "../../finance/financial-closing/RequiredStatementType";

const MONTH_INCLUDE = {
  checklistItems: { include: { requirement: true } },
} as const;

type MonthRow = Prisma.FinancialMonthGetPayload<{ include: typeof MONTH_INCLUDE }>;
type ChecklistItemRow = MonthRow["checklistItems"][number];

const DATE_TAG = "__date";

/**
 * The only place in the codebase that touches `closingSnapshot` as raw JSON
 * — everywhere else sees the strongly typed ClosingSnapshot. Date fields
 * round-trip losslessly via a tagged `{ __date: isoString }` wrapper
 * (distinct from /api/finance/pipeline/route.ts's one-way display replacer,
 * which is a different consumer contract — see ADR-021).
 *
 * This walks the object tree itself rather than using a JSON.stringify
 * replacer: Date.prototype.toJSON() runs before a replacer ever sees the
 * value, so `value instanceof Date` inside a replacer is always false by
 * the time it's checked — the tag would silently never apply.
 */
function tagDates(value: unknown): unknown {
  if (value instanceof Date) return { [DATE_TAG]: value.toISOString() };
  if (Array.isArray(value)) return value.map(tagDates);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) result[k] = tagDates(v);
    return result;
  }
  return value;
}

function serializeClosingSnapshot(snapshot: ClosingSnapshot): Prisma.InputJsonValue {
  return tagDates(snapshot) as Prisma.InputJsonValue;
}

function deserializeClosingSnapshot(raw: Prisma.JsonValue): ClosingSnapshot {
  return reviveDates(raw) as ClosingSnapshot;
}

function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === DATE_TAG && typeof obj[DATE_TAG] === "string") {
      return new Date(obj[DATE_TAG] as string);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) result[k] = reviveDates(v);
    return result;
  }
  return value;
}

export class PrismaFinancialMonthRepository implements IFinancialMonthRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPeriod(userId: string, year: number, month: number): Promise<FinancialMonth | null> {
    const row = await this.db.financialMonth.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: MONTH_INCLUDE,
    });
    return row ? toFinancialMonth(row) : null;
  }

  async create(
    userId: string,
    year: number,
    month: number,
    periodLabel: string,
    requirementIds: ReadonlyArray<string>,
  ): Promise<FinancialMonth> {
    const row = await this.db.financialMonth.create({
      data: {
        userId,
        year,
        month,
        periodLabel,
        checklistItems: { create: requirementIds.map(requirementId => ({ requirementId })) },
      },
      include: MONTH_INCLUDE,
    });
    return toFinancialMonth(row);
  }

  async findById(userId: string, monthId: string): Promise<FinancialMonth | null> {
    const row = await this.db.financialMonth.findFirst({
      where: { id: monthId, userId },
      include: MONTH_INCLUDE,
    });
    return row ? toFinancialMonth(row) : null;
  }

  async findLatestClosed(userId: string): Promise<FinancialMonth | null> {
    const row = await this.db.financialMonth.findFirst({
      where: { userId, status: FinancialMonthStatus.CLOSED },
      orderBy: { closedAt: "desc" },
      include: MONTH_INCLUDE,
    });
    return row ? toFinancialMonth(row) : null;
  }

  async save(month: FinancialMonth): Promise<FinancialMonth> {
    await this.db.$transaction([
      this.db.financialMonth.update({
        where: { id: month.id },
        data: {
          status: month.status,
          salaryConfirmed: month.salaryConfirmed,
          salaryConfirmedAt: month.salaryConfirmedAt,
          closingSnapshot: month.closingSnapshot
            ? serializeClosingSnapshot(month.closingSnapshot)
            : Prisma.DbNull,
          closedAt: month.closedAt,
          archivedAt: month.archivedAt,
        },
      }),
      ...month.checklistItems.map(item =>
        this.db.financialMonthChecklistItem.update({
          where: { id: item.id },
          data: {
            status: item.status,
            matchedStatementUploadId: item.matchedStatementUploadId,
            satisfiedAt: item.satisfiedAt,
          },
        }),
      ),
    ]);

    const saved = await this.db.financialMonth.findUniqueOrThrow({
      where: { id: month.id },
      include: MONTH_INCLUDE,
    });
    return toFinancialMonth(saved);
  }
}

function toFinancialMonth(row: MonthRow): FinancialMonth {
  return {
    id: row.id,
    userId: row.userId,
    year: row.year,
    month: row.month,
    periodLabel: row.periodLabel,
    status: row.status as FinancialMonthStatus,
    salaryConfirmed: row.salaryConfirmed,
    salaryConfirmedAt: row.salaryConfirmedAt,
    closingSnapshot: row.closingSnapshot ? deserializeClosingSnapshot(row.closingSnapshot) : null,
    closedAt: row.closedAt,
    archivedAt: row.archivedAt,
    checklistItems: row.checklistItems.map(toChecklistItem),
  };
}

function toChecklistItem(item: ChecklistItemRow): ChecklistItem {
  return {
    id: item.id,
    requirementId: item.requirementId,
    label: item.requirement.label,
    statementType: item.requirement.statementType as RequiredStatementType,
    status: item.status as ChecklistItemStatus,
    matchedStatementUploadId: item.matchedStatementUploadId,
    satisfiedAt: item.satisfiedAt,
  };
}
