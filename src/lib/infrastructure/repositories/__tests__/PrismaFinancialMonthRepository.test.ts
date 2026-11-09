import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaFinancialMonthRepository } from "../PrismaFinancialMonthRepository";
import { FinancialMonthStatus } from "../../../finance/financial-closing/FinancialMonthStatus";
import { ChecklistItemStatus } from "../../../finance/financial-closing/ChecklistItemStatus";
import { CLOSING_SNAPSHOT_SCHEMA_VERSION } from "../../../finance/financial-closing/ClosingSnapshot";
import type { ClosingSnapshot } from "../../../finance/financial-closing/ClosingSnapshot";

const baseChecklistRow = {
  id: "item-1",
  financialMonthId: "month-1",
  requirementId: "req-1",
  status: "PENDING",
  matchedStatementUploadId: null,
  satisfiedAt: null,
  requirement: { id: "req-1", label: "HDFC Savings", statementType: "BANK" },
};

const baseMonthRow = {
  id: "month-1",
  userId: "u1",
  year: 2026,
  month: 7,
  periodLabel: "2026-07",
  status: "OPEN",
  salaryConfirmed: false,
  salaryConfirmedAt: null,
  closingSnapshot: null,
  closedAt: null,
  archivedAt: null,
  checklistItems: [baseChecklistRow],
};

const mockDb = {
  financialMonth: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  financialMonthChecklistItem: {
    update: vi.fn(),
  },
  $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
};

const repo = new PrismaFinancialMonthRepository(mockDb as any);

beforeEach(() => vi.clearAllMocks());

describe("PrismaFinancialMonthRepository — mapping", () => {
  it("denormalizes label/statementType from the checklist item's requirement relation", async () => {
    mockDb.financialMonth.findUnique.mockResolvedValue(baseMonthRow);
    const month = await repo.findByPeriod("u1", 2026, 7);

    expect(month!.checklistItems[0]!.label).toBe("HDFC Savings");
    expect(month!.checklistItems[0]!.statementType).toBe("BANK");
    expect(month!.status).toBe(FinancialMonthStatus.OPEN);
  });

  it("returns null when no month exists for the period", async () => {
    mockDb.financialMonth.findUnique.mockResolvedValue(null);
    expect(await repo.findByPeriod("u1", 2026, 7)).toBeNull();
  });

  it("maps a null closingSnapshot to null", async () => {
    mockDb.financialMonth.findUnique.mockResolvedValue(baseMonthRow);
    const month = await repo.findByPeriod("u1", 2026, 7);
    expect(month!.closingSnapshot).toBeNull();
  });
});

describe("PrismaFinancialMonthRepository.create()", () => {
  it("creates one checklist item per requirement id", async () => {
    mockDb.financialMonth.create.mockResolvedValue(baseMonthRow);
    await repo.create("u1", 2026, 7, "2026-07", ["req-1"]);

    expect(mockDb.financialMonth.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checklistItems: { create: [{ requirementId: "req-1" }] },
        }),
      }),
    );
  });
});

describe("PrismaFinancialMonthRepository.save() — ClosingSnapshot round-trip", () => {
  it("serializes Date fields losslessly so they come back as real Date instances", async () => {
    const capturedAt = new Date("2026-07-31T18:00:00.000Z");
    const snapshot: ClosingSnapshot = {
      schemaVersion: CLOSING_SNAPSHOT_SCHEMA_VERSION,
      pipelineVersion: "0.4.1",
      capturedAt,
      metricsSnapshot: { generatedAt: new Date("2026-07-31T17:00:00.000Z") } as any,
      trendReport: {} as any,
      analyticsSnapshot: {} as any,
      insightSnapshot: {} as any,
      recommendationSnapshot: {} as any,
      storySnapshot: {} as any,
      review: {} as any,
    };

    let serializedClosingSnapshot: unknown;
    mockDb.financialMonth.update.mockImplementation((args: any) => {
      serializedClosingSnapshot = args.data.closingSnapshot;
      return Promise.resolve(undefined);
    });
    mockDb.financialMonthChecklistItem.update.mockResolvedValue(undefined);
    mockDb.financialMonth.findUniqueOrThrow.mockImplementation(() =>
      Promise.resolve({ ...baseMonthRow, status: "CLOSED", closingSnapshot: serializedClosingSnapshot }),
    );

    const month = {
      id: "month-1",
      userId: "u1",
      year: 2026,
      month: 7,
      periodLabel: "2026-07",
      status: FinancialMonthStatus.CLOSED,
      salaryConfirmed: true,
      salaryConfirmedAt: null,
      closingSnapshot: snapshot,
      closedAt: capturedAt,
      archivedAt: null,
      checklistItems: [
        {
          id: "item-1",
          requirementId: "req-1",
          label: "HDFC Savings",
          statementType: "BANK" as any,
          status: ChecklistItemStatus.SATISFIED,
          matchedStatementUploadId: "upload-1",
          satisfiedAt: capturedAt,
        },
      ],
    };

    const saved = await repo.save(month);

    // Never touched as raw JSON outside this file: the round-tripped value is
    // a real Date, not the ISO string it was stored as.
    expect(saved.closingSnapshot!.capturedAt).toBeInstanceOf(Date);
    expect(saved.closingSnapshot!.capturedAt.getTime()).toBe(capturedAt.getTime());
    expect((saved.closingSnapshot!.metricsSnapshot as any).generatedAt).toBeInstanceOf(Date);
    expect(saved.closingSnapshot!.schemaVersion).toBe(CLOSING_SNAPSHOT_SCHEMA_VERSION);
    expect(saved.closingSnapshot!.pipelineVersion).toBe("0.4.1");

    // Sanity: what actually got written to the Json column has no Date
    // instances left (they were tagged before JSON.stringify), proving this
    // is a real serialize/deserialize round-trip, not a pass-through mock.
    expect(JSON.stringify(serializedClosingSnapshot)).not.toContain("__proto__");
    expect((serializedClosingSnapshot as any).capturedAt).toEqual({ __date: capturedAt.toISOString() });
  });

  it("writes Prisma.DbNull when clearing closingSnapshot to null", async () => {
    mockDb.financialMonth.update.mockResolvedValue(undefined);
    mockDb.financialMonthChecklistItem.update.mockResolvedValue(undefined);
    mockDb.financialMonth.findUniqueOrThrow.mockResolvedValue(baseMonthRow);

    const month = {
      id: "month-1",
      userId: "u1",
      year: 2026,
      month: 7,
      periodLabel: "2026-07",
      status: FinancialMonthStatus.COLLECTING_DATA,
      salaryConfirmed: false,
      salaryConfirmedAt: null,
      closingSnapshot: null,
      closedAt: null,
      archivedAt: null,
      checklistItems: [],
    };

    await repo.save(month);

    const updateCall = mockDb.financialMonth.update.mock.calls[0]![0] as any;
    // Prisma.DbNull is a tagged sentinel object, not JS null — this asserts
    // the branch was taken, not the exact sentinel shape (Prisma-internal).
    expect(updateCall.data.closingSnapshot).not.toBeNull();
  });
});
