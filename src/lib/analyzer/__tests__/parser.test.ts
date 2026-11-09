import { describe, it, expect } from "vitest";
import { dedupeTransactions } from "../parser";
import type { StatementTransaction } from "../parser";

function mk(overrides: Partial<StatementTransaction>): StatementTransaction {
  return {
    date: "2026-04-05",
    description: "UPI-SAMPLE MERCHANT-sample@ybl-YESB0YBLUPI-123456789012-Paid",
    debit: 0,
    credit: 0,
    balance: null,
    referenceId: null,
    merchant: null,
    category: "needs_review",
    ...overrides,
  };
}

describe("dedupeTransactions", () => {
  it("collapses an exact duplicate (same date, amount, description, referenceId) to one", () => {
    const tx = mk({
      date: "2026-04-05",
      debit: 13344,
      description: "ACH D- TP ACH ICICI BANK-2148754928 Value Dt 05/04/2026 Ref 003342438952",
      referenceId: "003342438952",
    });

    const result = dedupeTransactions([tx, { ...tx }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(tx);
  });

  it("matches descriptions case-insensitively", () => {
    const a = mk({ date: "2026-04-05", debit: 500, description: "UPI-JOHN DOE PAYMENT", referenceId: null });
    const b = mk({ date: "2026-04-05", debit: 500, description: "upi-john doe payment", referenceId: null });

    const result = dedupeTransactions([a, b]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(a);
  });

  it("normalizes internal whitespace when comparing descriptions", () => {
    const a = mk({ date: "2026-04-05", debit: 500, description: "UPI-JOHN   DOE\tPAYMENT", referenceId: null });
    const b = mk({ date: "2026-04-05", debit: 500, description: "UPI-JOHN DOE PAYMENT", referenceId: null });

    const result = dedupeTransactions([a, b]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(a);
  });

  it("dedupes matching date/amount/normalized-description when referenceId is absent (banks that don't provide one)", () => {
    const a = mk({
      date: "2026-04-05",
      debit: 500,
      description: "UPI-JOHN DOE  Payment",
      referenceId: null,
    });
    const b = mk({
      date: "2026-04-05",
      debit: 500,
      description: "upi-john doe payment", // same content, different case/whitespace
      referenceId: null,
    });

    const result = dedupeTransactions([a, b]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(a);
  });

  it("keeps both legitimate repeated payments — same merchant/amount/day but distinct referenceId", () => {
    const a = mk({ date: "2026-04-05", debit: 500, description: "UPI-MERCHANT X", referenceId: "REF001" });
    const b = mk({ date: "2026-04-05", debit: 500, description: "UPI-MERCHANT X", referenceId: "REF002" });

    const result = dedupeTransactions([a, b]);

    expect(result).toHaveLength(2);
    expect(result).toEqual([a, b]);
  });

  it("keeps both a debit and a credit with the same amount/description/date — they are not the same transaction", () => {
    const debitTx = mk({ date: "2026-04-05", debit: 500, credit: 0, description: "SAME DESCRIPTION", referenceId: null });
    const creditTx = mk({ date: "2026-04-05", debit: 0, credit: 500, description: "SAME DESCRIPTION", referenceId: null });

    const result = dedupeTransactions([debitTx, creditTx]);

    expect(result).toHaveLength(2);
    expect(result).toEqual([debitTx, creditTx]);
  });

  it("collapses a transaction repeated across multi-page extraction into one, preserving surrounding order", () => {
    const first = mk({ date: "2026-04-01", debit: 180, description: "UPI-AJOY E T", referenceId: "R1" });
    const boundary = mk({ date: "2026-04-05", debit: 13344, description: "ACH D- TP ACH ICICI BANK-2148754928", referenceId: "R2" });
    const boundaryRepeatedOnNextPage = { ...boundary };
    const last = mk({ date: "2026-04-06", debit: 25000, description: "UPI-VYBHAV SUNIL KUMAR", referenceId: "R3" });

    // page 1 ends with `boundary`; page 2 begins by re-extracting the same row
    const page1 = [first, boundary];
    const page2 = [boundaryRepeatedOnNextPage, last];

    const result = dedupeTransactions([...page1, ...page2]);

    expect(result).toEqual([first, boundary, last]);
  });

  it("collapses transactions duplicated across a chunk-extraction boundary (the production bug this fix targets)", () => {
    // Mirrors the real incident found in production data: a single upload's
    // chunked AI extraction produced two separate duplicate pairs, scattered
    // through an otherwise-correct 51-transaction statement, each pair created
    // milliseconds apart by two parallel chunk calls extracting the same
    // boundary-adjacent row.
    const emi = mk({
      date: "2026-04-12",
      debit: 25436,
      description: "EMI 160830247 Chq S160830247113 0426160830247 Value Dt 12/04/2026 Ref 160830247",
      referenceId: "160830247",
    });
    const unrelatedBefore = mk({ date: "2026-04-11", debit: 600, description: "UPI-ARCHANA DAS", referenceId: "R10" });
    const unrelatedAfter = mk({ date: "2026-04-13", debit: 240, description: "UPI-UMA P P", referenceId: "R11" });

    const chunkAOutput = [unrelatedBefore, emi];
    const chunkBOutput = [{ ...emi }, unrelatedAfter]; // chunk B re-extracts the boundary row

    const merged: StatementTransaction[] = [];
    merged.push(...chunkAOutput);
    merged.push(...chunkBOutput);

    const result = dedupeTransactions(merged);

    expect(result).toEqual([unrelatedBefore, emi, unrelatedAfter]);
  });

  it("preserves original first-occurrence order when removing duplicates from arbitrary positions", () => {
    const a = mk({ date: "2026-04-01", debit: 100, description: "A", referenceId: "A" });
    const b = mk({ date: "2026-04-02", debit: 200, description: "B", referenceId: "B" });
    const c = mk({ date: "2026-04-03", debit: 300, description: "C", referenceId: "C" });
    const d = mk({ date: "2026-04-04", debit: 400, description: "D", referenceId: "D" });

    // duplicates of b and a scattered later in the list
    const input = [a, b, c, { ...b }, d, { ...a }];

    const result = dedupeTransactions(input);

    expect(result).toEqual([a, b, c, d]);
  });

  it("returns an empty array unchanged", () => {
    expect(dedupeTransactions([])).toEqual([]);
  });

  it("leaves a list with no duplicates fully intact and in order", () => {
    const a = mk({ date: "2026-04-01", debit: 100, description: "A", referenceId: "A" });
    const b = mk({ date: "2026-04-02", debit: 200, description: "B", referenceId: "B" });

    expect(dedupeTransactions([a, b])).toEqual([a, b]);
  });
});
