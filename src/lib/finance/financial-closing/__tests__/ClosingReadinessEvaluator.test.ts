import { describe, it, expect } from "vitest";
import { ClosingReadinessEvaluator } from "../ClosingReadinessEvaluator";
import { FinancialMonthStatus } from "../FinancialMonthStatus";
import { ChecklistItemStatus } from "../ChecklistItemStatus";
import { makeFinancialMonth, makeChecklistItem } from "./testHelpers";

describe("ClosingReadinessEvaluator.nextStatus()", () => {
  const evaluator = new ClosingReadinessEvaluator();

  it("stays OPEN with no satisfied items and no salary confirmation", () => {
    const month = makeFinancialMonth({ checklistItems: [makeChecklistItem()] });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.OPEN);
  });

  it("moves to COLLECTING_DATA once at least one item is satisfied", () => {
    const month = makeFinancialMonth({
      checklistItems: [
        makeChecklistItem({ id: "a", status: ChecklistItemStatus.SATISFIED }),
        makeChecklistItem({ id: "b" }),
      ],
    });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.COLLECTING_DATA);
  });

  it("stays COLLECTING_DATA when all items are satisfied but salary isn't confirmed (salary-only-missing)", () => {
    const month = makeFinancialMonth({
      salaryConfirmed: false,
      checklistItems: [makeChecklistItem({ status: ChecklistItemStatus.SATISFIED })],
    });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.COLLECTING_DATA);
  });

  it("becomes READY_TO_CLOSE once every item is satisfied and salary is confirmed", () => {
    const month = makeFinancialMonth({
      salaryConfirmed: true,
      checklistItems: [makeChecklistItem({ status: ChecklistItemStatus.SATISFIED })],
    });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.READY_TO_CLOSE);
  });

  it("treats zero active checklist items as vacuously satisfied — salary confirmation alone is enough", () => {
    const month = makeFinancialMonth({ salaryConfirmed: true, checklistItems: [] });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.READY_TO_CLOSE);
  });

  it("stays OPEN with zero checklist items and no salary confirmation", () => {
    const month = makeFinancialMonth({ salaryConfirmed: false, checklistItems: [] });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.OPEN);
  });

  it("never transitions out of CLOSED automatically", () => {
    const month = makeFinancialMonth({ status: FinancialMonthStatus.CLOSED, salaryConfirmed: true, checklistItems: [] });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.CLOSED);
  });

  it("never transitions out of ARCHIVED automatically", () => {
    const month = makeFinancialMonth({ status: FinancialMonthStatus.ARCHIVED });
    expect(evaluator.nextStatus(month)).toBe(FinancialMonthStatus.ARCHIVED);
  });
});
