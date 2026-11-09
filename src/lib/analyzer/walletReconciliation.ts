import { db } from "@/lib/db/prisma";

// Merchant name fragments that indicate a wallet top-up on a credit card statement
const WALLET_MERCHANT_PATTERNS = [
  /mobikwik/i,
  /paytm.*wallet/i,
  /phonepe.*wallet/i,
  /airtel.*money/i,
  /amazon.*pay.*wallet/i,
  /freecharge/i,
  /ola.*money/i,
  /wallet.*load/i,
  /wallet.*recharge/i,
  /zes\*mobikwik/i,
  /prepaid.*wallet/i,
];

// Small cashback/reward amounts from wallet platforms — never reclassify these
const CASHBACK_MAX_AMOUNT = 500;

function isWalletLoad(description: string, merchant?: string | null): boolean {
  const haystack = `${description} ${merchant ?? ""}`;
  return WALLET_MERCHANT_PATTERNS.some((re) => re.test(haystack));
}

export interface ReconciliationResult {
  rule1Fixed: number;   // CC statement wallet loads re-confirmed as DEBIT
  rule2Deleted: number; // Gmail duplicates deleted (matched CC DEBIT exists)
  rule2Transferred: number; // Gmail wallet credits reclassified as TRANSFER
  rule3Flagged: number; // Remaining wallet credits flagged for review
}

/**
 * Run wallet reconciliation for a user.
 *
 * Rule 1 — CC statement wallet loads: ensure type=DEBIT, category='wallet_load'
 * Rule 2 — Gmail wallet CREDITs:
 *   - If a matching CC DEBIT exists (±5% amount, ±5 days) → delete (duplicate)
 *   - Otherwise → reclassify as TRANSFER, category='wallet_load'
 * Rule 3 — Any remaining wallet CREDIT → mark ignored=true for manual review
 */
export async function reconcileWalletTransactions(
  userId: string
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    rule1Fixed: 0,
    rule2Deleted: 0,
    rule2Transferred: 0,
    rule3Flagged: 0,
  };

  // ── Rule 1: CC statement wallet loads ────────────────────────────────────
  const statementDebits = await db.transaction.findMany({
    where: {
      userId,
      type: "DEBIT",
      statementId: { not: null },
    },
    select: { id: true, description: true, merchant: true, category: true },
  });

  const rule1Ids: string[] = [];
  for (const tx of statementDebits) {
    if (isWalletLoad(tx.description, tx.merchant) && tx.category !== "wallet_load") {
      rule1Ids.push(tx.id);
    }
  }
  if (rule1Ids.length) {
    await db.transaction.updateMany({
      where: { id: { in: rule1Ids } },
      data: { category: "wallet_load" },
    });
    result.rule1Fixed = rule1Ids.length;
  }

  // ── Rule 2: Gmail wallet CREDITs ─────────────────────────────────────────
  const gmailWalletCredits = await db.transaction.findMany({
    where: {
      userId,
      type: "CREDIT",
      category: "wallet",
      statementId: null,
      // Don't touch small cashbacks — those are genuine income
      amount: { gt: CASHBACK_MAX_AMOUNT },
    },
    select: { id: true, amount: true, date: true, description: true },
  });

  // Load all CC statement wallet DEBITs for matching
  const ccWalletDebits = await db.transaction.findMany({
    where: {
      userId,
      type: "DEBIT",
      statementId: { not: null },
      category: { in: ["wallet", "wallet_load"] },
    },
    select: { id: true, amount: true, date: true },
  });

  const deleteIds: string[] = [];
  const transferIds: string[] = [];

  for (const credit of gmailWalletCredits) {
    const creditDate = new Date(credit.date).getTime();
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

    const match = ccWalletDebits.find((debit) => {
      const debitDate = new Date(debit.date).getTime();
      const amountClose = Math.abs(debit.amount - credit.amount) / credit.amount <= 0.05;
      const dateClose = Math.abs(debitDate - creditDate) <= fiveDaysMs;
      return amountClose && dateClose;
    });

    if (match) {
      // CC statement is authoritative — drop the Gmail duplicate
      deleteIds.push(credit.id);
    } else {
      // No CC match — still a transfer (bank/UPI funded wallet load), not income
      transferIds.push(credit.id);
    }
  }

  if (deleteIds.length) {
    await db.transaction.deleteMany({ where: { id: { in: deleteIds } } });
    result.rule2Deleted = deleteIds.length;
  }
  if (transferIds.length) {
    await db.transaction.updateMany({
      where: { id: { in: transferIds } },
      data: { type: "TRANSFER", category: "wallet_load" },
    });
    result.rule2Transferred = transferIds.length;
  }

  // ── Rule 3: Any remaining wallet CREDITs → flag for review ───────────────
  const remaining = await db.transaction.findMany({
    where: {
      userId,
      type: "CREDIT",
      category: "wallet",
      statementId: null,
      amount: { gt: CASHBACK_MAX_AMOUNT },
      ignored: false,
    },
    select: { id: true },
  });

  if (remaining.length) {
    await db.transaction.updateMany({
      where: { id: { in: remaining.map((t) => t.id) } },
      data: { ignored: true },
    });
    result.rule3Flagged = remaining.length;
  }

  return result;
}
