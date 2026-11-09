import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { encrypt } from "@/lib/crypto/encryption";
import { parsePDF, parseCSV, detectInstitutionFromFilename } from "@/lib/analyzer/parser";
import type { ParsePDFProgressEvent } from "@/lib/analyzer/parser";
import { getUserPasswordCandidates } from "@/lib/analyzer/profileCandidates";
import { reconcileWalletTransactions } from "@/lib/analyzer/walletReconciliation";
import { createDefaultFinancialStateService } from "@/lib/finance/pipeline/PipelineFactory";
import { getClosingService, mapStatementAccountType } from "@/app/api/financial-months/_shared";
import { STAGE_TITLES, classifyUploadError } from "@/lib/analyzer/importTypes";
import type { ImportStage, StageEvent, FileImportReport, ImportStreamEvent, UploadDiagnostic } from "@/lib/analyzer/importTypes";
import type { StatementFileType, StatementAccountType } from "@prisma/client";

// Chunked AI extraction now recovers from a truncated response by splitting
// and retrying (see parser.ts's extractChunkWithRetry), which trades more
// wall-clock time for not silently losing transactions. 60s was already
// tight for multi-chunk statements; gmail/sync and gmail/reprocess hit the
// same ceiling for the same reason and are set to 300s in vercel.json.
export const maxDuration = 300;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "text/csv", "text/plain", "application/vnd.ms-excel", "application/octet-stream"];

function mimeToFileType(mime: string, name: string): StatementFileType | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".csv")) return "CSV";
  if (mime === "application/pdf") return "PDF";
  if (mime === "text/csv" || mime === "text/plain") return "CSV";
  return null;
}

function toAccountType(raw: string | null): StatementAccountType | null {
  if (!raw) return null;
  const m: Record<string, StatementAccountType> = {
    savings: "SAVINGS",
    current: "CURRENT",
    credit_card: "CREDIT_CARD",
    salary: "SALARY",
    loan: "LOAN",
    investment: "INVESTMENT",
  };
  return m[raw.toLowerCase()] ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

  const manualPassword = (formData.get("password") as string | null)?.trim() || null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: ImportStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      const stage = (
        file: string,
        stageId: ImportStage,
        status: StageEvent["status"],
        data?: Record<string, unknown>,
        diagnostic?: UploadDiagnostic
      ) => {
        emit({ type: "stage", file, stage: stageId, title: STAGE_TITLES[stageId], status, data, diagnostic });
      };

      // Build full candidate list: manual password first, then profile-derived
      const profileCandidates = await getUserPasswordCandidates(userId);
      const passwordCandidates = manualPassword
        ? [manualPassword, ...profileCandidates]
        : profileCandidates;

      const results: FileImportReport[] = [];

      for (const file of files) {
        let currentStage: ImportStage = "upload";
        stage(file.name, "upload", "done"); // bytes already received — real transfer % is tracked client-side

        if (file.size > MAX_FILE_SIZE) {
          const diagnostic: UploadDiagnostic = { code: "UNSUPPORTED_FILE", message: "File exceeds 5 MB limit", recoverable: false };
          stage(file.name, "upload", "error", undefined, diagnostic);
          results.push({ file: file.name, success: false, diagnostic });
          continue;
        }

        const fileType = mimeToFileType(file.type, file.name);
        if (!fileType) {
          const diagnostic: UploadDiagnostic = { code: "UNSUPPORTED_FILE", message: "Unsupported file type — use PDF or CSV", recoverable: false };
          stage(file.name, "upload", "error", undefined, diagnostic);
          results.push({ file: file.name, success: false, diagnostic });
          continue;
        }

        const detectedBank = detectInstitutionFromFilename(file.name);
        stage(file.name, "detect-bank", "done", { bank: detectedBank });

        // Create statement record in PENDING state
        const statement = await db.statementUpload.create({
          data: {
            userId,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            institutionName: detectedBank,
            status: "PROCESSING",
          },
        });

        try {
          const buffer = Buffer.from(await file.arrayBuffer());

          // Store encrypted content for potential re-processing
          const encryptedContent = encrypt(buffer.toString("base64"));

          let parsed: Awaited<ReturnType<typeof parsePDF>>;
          if (fileType === "PDF") {
            const onProgress = (event: ParsePDFProgressEvent) => {
              if (event.status === "running") currentStage = event.stage;
              stage(file.name, event.stage, event.status, event.data);
            };
            parsed = await parsePDF(buffer, passwordCandidates, onProgress);
          } else {
            currentStage = "extract";
            stage(file.name, "extract", "running");
            const csvResult = parseCSV(buffer.toString("utf-8"));
            parsed = { ...csvResult, passwordUsed: null };
            stage(file.name, "extract", "done", { transactionCount: csvResult.transactions.length });
            stage(file.name, "categorise", "done");
          }

          // Compute totals
          let totalDebits = 0;
          let totalCredits = 0;
          for (const tx of parsed.transactions) {
            totalDebits += tx.debit;
            totalCredits += tx.credit;
          }

          // Persist transactions
          let created = 0;
          for (const tx of parsed.transactions) {
            const amount = tx.debit > 0 ? tx.debit : tx.credit;
            if (amount <= 0) continue;

            const TRANSFER_CATEGORIES = new Set(["banking", "wallet_load", "wallet"]);
            const txType = tx.credit > 0
              ? "CREDIT"
              : TRANSFER_CATEGORIES.has(tx.category ?? "")
                ? "TRANSFER"
                : "DEBIT";
            const date = tx.date ? new Date(tx.date) : new Date();
            if (isNaN(date.getTime())) continue;

            await db.transaction.create({
              data: {
                userId,
                statementId: statement.id,
                amount,
                currency: parsed.metadata.currency ?? "INR",
                type: txType,
                category: tx.category ?? "other",
                description: tx.description,
                merchant: tx.merchant ?? null,
                referenceId: tx.referenceId ?? null,
                date,
                confidence: 0.9,
                rawText: tx.description?.substring(0, 500) ?? null,
                metadata: tx.balance != null ? { balance: tx.balance } : {},
              },
            });
            created++;
          }

          const accountType = toAccountType(parsed.metadata.accountType);

          // Update statement to COMPLETED
          await db.statementUpload.update({
            where: { id: statement.id },
            data: {
              status: "COMPLETED",
              encryptedContent,
              institutionName: parsed.metadata.institution ?? detectedBank,
              accountType,
              accountNumber: parsed.metadata.accountNumber,
              periodFrom: parsed.metadata.periodFrom ? new Date(parsed.metadata.periodFrom) : null,
              periodTo: parsed.metadata.periodTo ? new Date(parsed.metadata.periodTo) : null,
              closingBalance: parsed.metadata.closingBalance,
              creditLimit: parsed.metadata.creditLimit,
              minimumDue: parsed.metadata.minimumDue,
              totalDue: parsed.metadata.totalDue,
              totalDebits,
              totalCredits,
              transactionCount: created,
            },
          });

          // Financial Intelligence — reuses the existing pipeline, no new
          // calculation logic. No caching upstream (see IFinancialStateService),
          // so this is a real recompute; report the current total, not a "new"
          // delta (FinancialInsight ids are freshly random every run, not
          // diffable across snapshots).
          currentStage = "financial-intelligence";
          stage(file.name, "financial-intelligence", "running");
          let insightCount: number | undefined;
          try {
            const pipelineResult = await createDefaultFinancialStateService(db).getPipelineResult(userId);
            insightCount = pipelineResult.insightSnapshot.insights.length;
          } catch (fiErr) {
            console.error("[upload] financial-intelligence stage failed:", fiErr);
          }
          stage(file.name, "financial-intelligence", "done", { insightCount });

          // Financial Closing — reuses the existing StatementMatcher/service,
          // same one the /checklist/suggest route already uses. Never auto-
          // links; only surfaces a suggestion for the user to confirm.
          currentStage = "closing-match";
          stage(file.name, "closing-match", "running");
          let closingMatch: { monthId: string; itemId: string; label: string } | null = null;
          try {
            const closingService = getClosingService();
            const month = await closingService.getOrCreateCurrentMonth(userId);
            const suggestion = closingService.suggestMatchForUpload(month, {
              accountType: mapStatementAccountType(accountType),
              institutionName: parsed.metadata.institution ?? detectedBank,
            });
            if (suggestion) {
              closingMatch = { monthId: month.id, itemId: suggestion.id, label: suggestion.label };
            }
          } catch (closingErr) {
            console.error("[upload] closing-match stage failed:", closingErr);
          }
          stage(file.name, "closing-match", "done", { match: closingMatch });

          results.push({ file: file.name, success: true, statementId: statement.id, transactionsCreated: created });
        } catch (err) {
          const diagnostic = classifyUploadError(err);
          stage(file.name, currentStage, "error", undefined, diagnostic);
          await db.statementUpload.update({
            where: { id: statement.id },
            data: { status: "FAILED", processingError: diagnostic.message },
          });
          results.push({ file: file.name, success: false, diagnostic });
        }
      }

      // Run wallet reconciliation after every upload — reclassifies wallet loads
      // from credit cards as expenses/transfers, never income
      void reconcileWalletTransactions(userId).catch((err) =>
        console.error("[upload] wallet reconciliation failed:", err)
      );

      emit({ type: "complete", results });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
