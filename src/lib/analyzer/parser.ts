import { getProvider, isAIEnabled } from "@/lib/ai/provider";
import type { AIProvider } from "@/lib/ai/provider";
import { STATEMENT_EXTRACTOR_SYSTEM } from "@/lib/ai/prompts";
import { tryExtractPDFText } from "@/lib/analyzer/pdfDecrypt";
import type { ExtractProgressEvent } from "@/lib/analyzer/pdfDecrypt";

export type ParsePDFProgressEvent =
  | ExtractProgressEvent
  | { stage: "extract"; status: "running" | "done"; data?: Record<string, unknown> }
  | { stage: "categorise"; status: "done"; data?: Record<string, unknown> };

export interface StatementTransaction {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number | null;
  referenceId: string | null;
  merchant: string | null;
  category: string;
}

export interface StatementMetadata {
  institution: string | null;
  accountType: "savings" | "current" | "credit_card" | "salary" | "loan" | "investment" | null;
  accountNumber: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  closingBalance: number | null;
  creditLimit: number | null;
  minimumDue: number | null;
  totalDue: number | null;
  currency: string;
}

export interface ParsedStatement {
  metadata: StatementMetadata;
  transactions: StatementTransaction[];
}

// ── PDF parsing via active AI provider ────────────────────────

const MIN_SPLIT_SIZE = 4000; // below this, a chunk has too few transactions to be worth splitting further
const MAX_SPLIT_DEPTH = 3; // caps worst-case fan-out at 2^3 = 8 calls for one original chunk

// A dense-enough chunk can make the model's JSON response hit maxTokens mid-
// generation — the JSON is then genuinely incomplete, so JSON.parse throws
// (typically "Unterminated string"). Simply skipping the chunk on failure
// loses every transaction in it. Instead, split it in half and retry each
// half — a smaller chunk needs a shorter response, which is far less likely
// to hit the same ceiling.
async function extractChunkWithRetry(
  provider: AIProvider,
  chunk: string,
  label: string,
  depth = 0
): Promise<ParsedStatement> {
  try {
    const raw = await provider.completeJSON<ParsedStatement>(
      STATEMENT_EXTRACTOR_SYSTEM,
      `Extract all transactions and metadata from the following bank or credit card statement text${label}:\n\n${chunk}`,
      { maxTokens: 8192 }
    );
    return normalise(raw);
  } catch (err) {
    if (depth >= MAX_SPLIT_DEPTH || chunk.length < MIN_SPLIT_SIZE * 2) {
      console.error(`[parsePDF] chunk${label} failed after ${depth} split(s), giving up:`, err);
      return { metadata: normalise({ metadata: {} as StatementMetadata, transactions: [] }).metadata, transactions: [] };
    }
    console.warn(
      `[parsePDF] chunk${label} failed (likely a truncated AI response) — splitting and retrying:`,
      err instanceof Error ? err.message : err
    );
    const mid = Math.floor(chunk.length / 2);
    const splitAt = chunk.lastIndexOf("\n", mid) > 0 ? chunk.lastIndexOf("\n", mid) : mid;
    const [first, second] = await Promise.all([
      extractChunkWithRetry(provider, chunk.slice(0, splitAt), `${label}.1`, depth + 1),
      extractChunkWithRetry(provider, chunk.slice(splitAt), `${label}.2`, depth + 1),
    ]);
    const mergedMeta = { ...second.metadata };
    for (const key of Object.keys(first.metadata) as (keyof StatementMetadata)[]) {
      if (first.metadata[key] != null) (mergedMeta as Record<string, unknown>)[key] = first.metadata[key];
    }
    return { metadata: mergedMeta, transactions: [...first.transactions, ...second.transactions] };
  }
}

export async function parsePDF(
  buffer: Buffer,
  passwordCandidates: string[] = [],
  onProgress?: (event: ParsePDFProgressEvent) => void
): Promise<ParsedStatement & { passwordUsed: string | null; duplicatesRemoved?: number }> {
  if (!isAIEnabled()) throw new Error("AI_DISABLED");

  // For non-encrypted PDFs, prefer the native PDF attachment path (passes the
  // full binary to the model, avoiding any text-extraction truncation).
  // For password-protected PDFs the model cannot decrypt them, so we fall back
  // to pdfjs text extraction → chunked AI calls.

  // Primary path: pdfjs text extraction → chunked AI calls.
  // This is reliable for all text-based PDFs and handles every page.
  // The attachment path is only used as a fallback for image-based PDFs
  // where pdfjs returns no extractable text.
  const { text: pdfText, passwordUsed } = await tryExtractPDFText(buffer, passwordCandidates, onProgress);

  // If pdfjs returned no text, this is likely a scanned/image-only PDF.
  // Fall back to sending the raw PDF bytes as an attachment to the AI model.
  if (!pdfText.trim()) {
    onProgress?.({ stage: "extract", status: "running" });
    const pdfBase64 = buffer.toString("base64");
    const resultText = await getProvider().completeWithAttachment(
      STATEMENT_EXTRACTOR_SYSTEM,
      "Extract all transactions and metadata from this bank or credit card statement. Return every transaction — do not truncate or summarise.",
      pdfBase64,
      "application/pdf",
      { maxTokens: 8192 }
    );
    const raw = JSON.parse(
      resultText.trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
    ) as ParsedStatement;
    const normed = normalise(raw);
    const dedupedTransactions = dedupeTransactions(normed.transactions);
    const duplicatesRemoved = normed.transactions.length - dedupedTransactions.length;
    if (duplicatesRemoved > 0) {
      console.log(`[parsePDF] deduplicated ${duplicatesRemoved} duplicate transaction(s)`);
    }
    onProgress?.({ stage: "extract", status: "done", data: { transactionCount: dedupedTransactions.length, duplicatesRemoved } });
    onProgress?.({ stage: "categorise", status: "done" });
    return { ...normed, transactions: dedupedTransactions, passwordUsed, duplicatesRemoved };
  }

  const CHUNK_SIZE = 40000; // ~10k tokens of input — safe for all providers
  const chunks: string[] = [];
  for (let offset = 0; offset < pdfText.length; offset += CHUNK_SIZE) {
    chunks.push(pdfText.slice(offset, offset + CHUNK_SIZE));
  }

  const provider = getProvider();
  const allTransactions: StatementTransaction[] = [];
  let mergedMetadata: Partial<StatementMetadata> = {};

  onProgress?.({ stage: "extract", status: "running" });
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const chunkLabel = chunks.length > 1 ? ` (part ${i + 1} of ${chunks.length})` : "";
    try {
      const normed = await extractChunkWithRetry(provider, chunk, chunkLabel);
      allTransactions.push(...normed.transactions);
      // Use first chunk's metadata (contains header info); supplement missing
      // fields from later chunks
      if (i === 0) {
        mergedMetadata = { ...normed.metadata };
      } else {
        // Prefer earlier values but fill in nulls from later chunks
        for (const key of Object.keys(normed.metadata) as (keyof StatementMetadata)[]) {
          if (mergedMetadata[key] == null && normed.metadata[key] != null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mergedMetadata as any)[key] = normed.metadata[key];
          }
        }
        // Always take the last chunk's closing balance (most recent)
        if (normed.metadata.closingBalance != null) {
          mergedMetadata.closingBalance = normed.metadata.closingBalance;
        }
        // Expand period range across chunks
        if (normed.metadata.periodTo != null) {
          mergedMetadata.periodTo = normed.metadata.periodTo;
        }
      }
    } catch (err) {
      // Log and skip a bad chunk rather than losing all transactions
      console.error(`[parsePDF] chunk ${i + 1}/${chunks.length} failed:`, err);
    }
  }

  const finalMetadata: StatementMetadata = {
    institution: mergedMetadata.institution ?? null,
    accountType: mergedMetadata.accountType ?? null,
    accountNumber: mergedMetadata.accountNumber ?? null,
    periodFrom: mergedMetadata.periodFrom ?? null,
    periodTo: mergedMetadata.periodTo ?? null,
    closingBalance: mergedMetadata.closingBalance ?? null,
    creditLimit: mergedMetadata.creditLimit ?? null,
    minimumDue: mergedMetadata.minimumDue ?? null,
    totalDue: mergedMetadata.totalDue ?? null,
    currency: mergedMetadata.currency ?? "INR",
  };

  const dedupedTransactions = dedupeTransactions(allTransactions);
  const duplicatesRemoved = allTransactions.length - dedupedTransactions.length;
  if (duplicatesRemoved > 0) {
    console.log(`[parsePDF] deduplicated ${duplicatesRemoved} duplicate transaction(s)`);
  }

  onProgress?.({ stage: "extract", status: "done", data: { transactionCount: dedupedTransactions.length, duplicatesRemoved } });
  onProgress?.({ stage: "categorise", status: "done" });

  return { metadata: finalMetadata, transactions: dedupedTransactions, passwordUsed, duplicatesRemoved };
}

// ── CSV parsing (native, no dependencies) ─────────────────────

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function findCol(headers: string[], patterns: string[]): string | null {
  for (const h of headers) {
    for (const p of patterns) {
      if (h.toLowerCase().includes(p.toLowerCase())) return h;
    }
  }
  return null;
}

function parseAmount(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[₹,\s]/g, ""));
  return isNaN(n) ? 0 : Math.abs(n);
}

function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();

  // Already ISO-ish
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y!.length === 2 ? `20${y}` : y;
    return `${year}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }

  // DD-MMM-YYYY or DD/MMM/YYYY (e.g. "05-Jan-2024")
  const dMonthY = s.match(/^(\d{1,2})[/\-\s]([A-Za-z]{3})[/\-\s](\d{2,4})$/);
  if (dMonthY) {
    const d = new Date(`${dMonthY[1]} ${dMonthY[2]} ${dMonthY[3]}`);
    if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  }

  // Try native Date parse as last resort
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);

  return null;
}

function inferCategory(description: string): string {
  const d = description.toLowerCase();

  // Confident merchant/keyword matches — assign category only when specific enough
  if (/swiggy|zomato|dominos|pizza|burger|kfc|mcdonald|restaurant|cafe|food/.test(d)) return "food";
  if (/grocery|bigbasket|blinkit|zepto|reliance fresh|dmart|supermarket/.test(d)) return "groceries";
  if (/petrol|diesel|fuel|hp petrol|iocl|bpcl|shell/.test(d)) return "fuel";
  if (/rent|pg|hostel|apartment|thajinnissa|silicon park owners|maintenance.*society|society.*maintenance/.test(d)) return "rent";
  if (/amazon|flipkart|myntra|ajio|nykaa|shopping|mall|store/.test(d)) return "shopping";
  if (/electricity|water|gas|broadband|internet|airtel|jio|bsnl|act|tata sky|dth|recharge/.test(d)) return "utilities";
  if (/netflix|spotify|hotstar|prime|disney|youtube premium|zee5|sonyliv|entertainment/.test(d)) return "subscriptions";
  if (/irctc|train|flight|makemytrip|goibibo|yatra|ola|uber|rapido|metro|travel/.test(d)) return "travel";
  if (/hospital|pharmacy|apollo|medplus|netmeds|healthcare|doctor|clinic/.test(d)) return "healthcare";
  if (/emi|loan|hdfc emi|icici emi|axis emi|bajaj|capital float/.test(d)) return "emi";
  if (/salary|stipend|payroll/.test(d)) return "salary";
  if (/refund|reversal|cashback/.test(d)) return "refunds";
  if (/mutual fund|sip|zerodha|groww|paytm money|investment|shares|stocks|equity/.test(d)) return "investments";
  if (/insurance|lic|hdfc life|tata aia|premium/.test(d)) return "insurance";
  if (/atm|cash withdrawal|neft|rtgs|imps|fund transfer|transfer to|trf to|by transfer|credit card payment|cc payment|creditcard|cc bill|card payment|internal transfer|self transfer|sweep/.test(d)) return "banking";
  if (/wallet|paytm|phonepe|gpay|upi.*load|load.*wallet/.test(d)) return "wallet_load";
  if (/tax|gst|tds|income tax/.test(d)) return "tax";

  // Generic bank-generated descriptions — could be anything; require manual review
  if (/^ecs debit|^nach debit|^nach cr|^ecs cr|^pos debit|^pos purchase|^debit card purchase|^mandate debit|^auto debit|^standing instruction|^si debit|^ach debit/.test(d)) return "needs_review";
  if (/^upi transaction$|^upi txn$|^upi transfer$|^upi\/\s*$/.test(d)) return "needs_review";
  if (/^debit$|^payment$|^purchase$|^transaction$/.test(d)) return "needs_review";

  // Unknown — not enough information to assign any category
  return "needs_review";
}

export function parseCSV(csvText: string): ParsedStatement {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { metadata: { currency: "INR", institution: null, accountType: null, accountNumber: null, periodFrom: null, periodTo: null, closingBalance: null, creditLimit: null, minimumDue: null, totalDue: null }, transactions: [] };
  }

  // Find header row (first row with recognisable column names)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i]!.toLowerCase();
    if (lower.includes("date") || lower.includes("narration") || lower.includes("description") || lower.includes("particulars")) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCSVRow(lines[headerIdx]!).map((h) => h.toLowerCase().replace(/['"]/g, "").trim());

  const dateCol   = findCol(headers, ["tran date", "transaction date", "txn date", "value date", "date"]);
  const descCol   = findCol(headers, ["narration", "description", "particulars", "details", "remarks", "transaction details"]);
  const debitCol  = findCol(headers, ["debit amount", "withdrawal amt", "withdrawal", "debit", "dr", "withdrawals"]);
  const creditCol = findCol(headers, ["credit amount", "deposit amt", "deposit", "credit", "cr", "deposits"]);
  const balCol    = findCol(headers, ["closing balance", "balance", "bal", "running balance"]);
  const refCol    = findCol(headers, ["chq./ref.no.", "ref no", "reference", "chq no", "cheque", "utr", "ref"]);

  const transactions: StatementTransaction[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]!);
    const get = (col: string | null) => (col ? (row[headers.indexOf(col)] ?? "") : "");

    const rawDate = get(dateCol);
    const date = parseDate(rawDate);
    if (!date) continue; // skip non-transaction rows

    const description = get(descCol).replace(/^["']|["']$/g, "").trim();
    if (!description) continue;

    const debit  = parseAmount(get(debitCol));
    const credit = parseAmount(get(creditCol));
    if (debit === 0 && credit === 0) continue; // skip zero-amount rows

    const rawBal = get(balCol);
    const balance = rawBal ? parseAmount(rawBal) || null : null;

    transactions.push({
      date,
      description,
      debit,
      credit,
      balance,
      referenceId: get(refCol) || null,
      merchant: null,
      category: inferCategory(description),
    });
  }

  return {
    metadata: {
      institution: null,
      accountType: null,
      accountNumber: null,
      periodFrom: transactions[0]?.date ?? null,
      periodTo: transactions[transactions.length - 1]?.date ?? null,
      closingBalance: transactions[transactions.length - 1]?.balance ?? null,
      creditLimit: null,
      minimumDue: null,
      totalDue: null,
      currency: "INR",
    },
    transactions,
  };
}

// ── Dedupe transactions extracted across chunk boundaries ─────
//
// Both the top-level CHUNK_SIZE splitting and extractChunkWithRetry's
// truncation-recovery splitting cut raw statement text without any
// awareness of transaction-record boundaries. When a transaction sits at
// or near a cut point, it can be fully readable from both sides of the
// split, so both chunk calls extract it and it survives into the merged
// list twice. referenceId is included in the key when present since it's
// read verbatim from the statement text — two chunks extracting the same
// line will agree on it, while two genuinely distinct same-day/same-amount
// transactions (e.g. two identical UPI payments) will not.
export function dedupeTransactions(transactions: StatementTransaction[]): StatementTransaction[] {
  const seen = new Set<string>();
  const deduped: StatementTransaction[] = [];
  for (const t of transactions) {
    const key = [
      t.date,
      t.debit,
      t.credit,
      t.description.trim().toLowerCase().replace(/\s+/g, " "),
      t.referenceId ?? "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(t);
  }
  return deduped;
}

// ── Normalise Gemini output ────────────────────────────────────

function normalise(raw: ParsedStatement): ParsedStatement {
  return {
    metadata: {
      institution: raw.metadata?.institution ?? null,
      accountType: raw.metadata?.accountType ?? null,
      accountNumber: raw.metadata?.accountNumber ?? null,
      periodFrom: raw.metadata?.periodFrom ?? null,
      periodTo: raw.metadata?.periodTo ?? null,
      closingBalance: raw.metadata?.closingBalance ?? null,
      creditLimit: raw.metadata?.creditLimit ?? null,
      minimumDue: raw.metadata?.minimumDue ?? null,
      totalDue: raw.metadata?.totalDue ?? null,
      currency: raw.metadata?.currency ?? "INR",
    },
    transactions: (raw.transactions ?? []).map((t) => ({
      date: t.date,
      description: t.description ?? "",
      debit: Number(t.debit) || 0,
      credit: Number(t.credit) || 0,
      balance: t.balance != null ? Number(t.balance) : null,
      referenceId: t.referenceId ?? null,
      merchant: t.merchant ?? null,
      category: t.category ?? "other",
    })),
  };
}

// ── Detect institution from filename ──────────────────────────

export function detectInstitutionFromFilename(filename: string): string | null {
  const f = filename.toLowerCase();
  if (f.includes("hdfc")) return "HDFC Bank";
  if (f.includes("icici")) return "ICICI Bank";
  if (f.includes("axis")) return "Axis Bank";
  if (f.includes("sbi") || f.includes("state bank")) return "State Bank of India";
  if (f.includes("kotak")) return "Kotak Mahindra Bank";
  if (f.includes("amex") || f.includes("american express")) return "American Express";
  if (f.includes("onecard") || f.includes("one card")) return "OneCard";
  if (f.includes("yes bank")) return "Yes Bank";
  if (f.includes("indusind")) return "IndusInd Bank";
  if (f.includes("idfc")) return "IDFC First Bank";
  if (f.includes("pnb") || f.includes("punjab national")) return "Punjab National Bank";
  return null;
}
