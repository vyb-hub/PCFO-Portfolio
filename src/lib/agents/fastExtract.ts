// Zero-token rule-based extraction for predictable Indian bank alert formats.
// Returns null if the pattern doesn't match — caller falls back to AI.

import type { ExtractedTransaction } from "@/types";

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[₹,\s]/g, "")) || 0;
}

function parseDate(raw: string): string {
  // DD/MM/YY or DD/MM/YYYY
  const dmy = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y!.length === 2 ? `20${y}` : y;
    return `${year}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  // "May 25, 2026" or "25 May 2026"
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  return new Date().toISOString().substring(0, 10);
}

// ── HDFC UPI / Account debit alert ───────────────────────────
// "Rs.200.00 has been debited from your HDFC Bank Account no. XXXX on DD/MM/YY"
function tryHDFCUPI(body: string): ExtractedTransaction | null {
  const debit = body.match(/Rs\.?([\d,]+\.?\d*)\s+has been debited from your HDFC Bank\s*(?:Account\s*(?:no\.?)?\s*[\dXx]+)?\s*on\s*([\d\/\-]+)/i);
  if (debit) {
    const amount = parseAmount(debit[1]!);
    if (!amount) return null;
    // Try to find merchant from UPI remark
    const upiRef = body.match(/UPI[\/\-](?:P2[MP]|DR|CR)[\/\-](\d+)[\/\-]([^\n\/]+)/i);
    const merchant = upiRef ? upiRef[2]!.trim() : null;
    return {
      amount,
      currency: "INR",
      type: "DEBIT",
      description: merchant ? `UPI payment to ${merchant}` : "UPI debit",
      merchant: merchant ?? undefined,
      account: "HDFC Bank",
      accountLast4: body.match(/Account\s*(?:no\.?)?\s*(?:xx)?(\d{4})/i)?.[1] ?? undefined,
      referenceId: upiRef?.[1] ?? undefined,
      date: parseDate(debit[2]!),
      category: "banking",
      confidence: 0.95,
      rawText: body.substring(0, 300),
    };
  }
  return null;
}

// ── ICICI Credit Card alert ───────────────────────────────────
// "Transaction of INR 1,500.00 at Amazon on 25-05-2026 on your ICICI Bank Credit Card XX XXXX"
// "Your ICICI Bank Credit Card XX9003 has been used for Rs 349.00 at Netflix on May 25, 2026"
function tryICICICard(body: string): ExtractedTransaction | null {
  const p1 = body.match(/[Tt]ransaction\s+of\s+(?:INR|Rs\.?)\s*([\d,]+\.?\d*)\s+at\s+([^\n]+?)\s+on\s+([\d\w\s,\-\/]+?)(?:\s+on your|\s+at your|\.|$)/i);
  if (p1) {
    const amount = parseAmount(p1[1]!);
    const merchant = p1[2]!.trim();
    if (!amount) return null;
    return {
      amount,
      currency: "INR",
      type: "DEBIT",
      description: `Purchase at ${merchant}`,
      merchant,
      account: "ICICI Bank Credit Card",
      accountLast4: body.match(/[Cc]redit [Cc]ard\s+[Xx]{2}(\d{4})/)?.[1] ?? undefined,
      referenceId: undefined,
      date: parseDate(p1[3]!.trim()),
      category: "shopping",
      confidence: 0.9,
      rawText: body.substring(0, 300),
    };
  }
  const p2 = body.match(/[Cc]redit [Cc]ard\s+[Xx]{2}(\d{4})\s+has been used for\s+(?:a transaction of\s+)?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)\s+at\s+([^\n]+?)\s+on\s+([\d\w\s,\-\/]+?)(?:\.|$)/i);
  if (p2) {
    const amount = parseAmount(p2[2]!);
    const merchant = p2[3]!.trim();
    if (!amount) return null;
    return {
      amount,
      currency: "INR",
      type: "DEBIT",
      description: `Purchase at ${merchant}`,
      merchant,
      account: "ICICI Bank Credit Card",
      accountLast4: p2[1]!,
      referenceId: undefined,
      date: parseDate(p2[4]!.trim()),
      category: "shopping",
      confidence: 0.9,
      rawText: body.substring(0, 300),
    };
  }
  return null;
}

export function fastExtract(
  sender: string,
  subject: string,
  body: string
): ExtractedTransaction[] | null {
  const s = sender.toLowerCase();
  const sub = subject.toLowerCase();

  if (s.includes("hdfcbank") || s.includes("hdfc")) {
    const tx = tryHDFCUPI(body);
    if (tx) return [tx];
  }

  if (s.includes("icici")) {
    const tx = tryICICICard(body);
    if (tx) return [tx];
  }

  return null; // no pattern matched — use AI
}
