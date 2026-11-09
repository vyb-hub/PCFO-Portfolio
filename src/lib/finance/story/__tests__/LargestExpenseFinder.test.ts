import { describe, it, expect } from "vitest";
import { findLargestExpense } from "../generators/LargestExpenseFinder";
import { makeAggregate, makeTransaction, money } from "./testHelpers";

describe("findLargestExpense", () => {
  it("returns null when there are no expense transactions", () => {
    const aggregate = makeAggregate("u1", []);
    expect(findLargestExpense(aggregate)).toBeNull();
  });

  it("returns null when only CREDIT/TRANSFER transactions exist", () => {
    const aggregate = makeAggregate("u1", [
      makeTransaction({ type: "CREDIT", amount: money(50000) }),
      makeTransaction({ type: "TRANSFER", amount: money(20000) }),
    ]);
    expect(findLargestExpense(aggregate)).toBeNull();
  });

  it("picks the single largest DEBIT transaction among mixed types", () => {
    const largest = makeTransaction({ id: "big", type: "DEBIT", amount: money(18500), merchant: "Amazon" });
    const aggregate = makeAggregate("u1", [
      makeTransaction({ type: "CREDIT", amount: money(90000) }),
      makeTransaction({ type: "DEBIT", amount: money(2000) }),
      largest,
      makeTransaction({ type: "TRANSFER", amount: money(99999) }),
      makeTransaction({ type: "REFUND", amount: money(5000) }),
      makeTransaction({ type: "DEBIT", amount: money(3000) }),
    ]);

    const fact = findLargestExpense(aggregate);
    expect(fact).not.toBeNull();
    expect(fact!.transaction.id).toBe("big");
  });

  it("handles a single expense transaction", () => {
    const only = makeTransaction({ id: "only", amount: money(1000) });
    const aggregate = makeAggregate("u1", [only]);

    const fact = findLargestExpense(aggregate);
    expect(fact!.transaction.id).toBe("only");
    expect(fact!.percentOfTotalExpenses).toBe(1);
    expect(fact!.multipleOfAverage).toBe(1);
    expect(fact!.transactionCount).toBe(1);
  });

  it("returns one of the tied transactions when multiple share the max amount", () => {
    const a = makeTransaction({ id: "a", amount: money(5000) });
    const b = makeTransaction({ id: "b", amount: money(5000) });
    const aggregate = makeAggregate("u1", [a, b]);

    const fact = findLargestExpense(aggregate);
    expect(["a", "b"]).toContain(fact!.transaction.id);
  });

  it("computes percentOfTotalExpenses and multipleOfAverage correctly", () => {
    // total = 1000 + 1000 + 8000 = 10000, largest = 8000 (80% of total)
    // average = 10000/3 = 3333.33, multiple = 8000/3333.33 = 2.4
    const aggregate = makeAggregate("u1", [
      makeTransaction({ id: "a", amount: money(1000) }),
      makeTransaction({ id: "b", amount: money(1000) }),
      makeTransaction({ id: "c", amount: money(8000) }),
    ]);

    const fact = findLargestExpense(aggregate);
    expect(fact!.transaction.id).toBe("c");
    expect(fact!.totalExpenseAmount.amount).toBe(10000);
    expect(fact!.percentOfTotalExpenses).toBeCloseTo(0.8, 5);
    expect(fact!.multipleOfAverage).toBeCloseTo(2.4, 5);
  });
});
