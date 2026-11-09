import { completeJSON, completeWithAttachment } from "@/lib/ai/claude";
import { EXTRACTOR_SYSTEM, ATTACHMENT_EXTRACTOR_SYSTEM } from "@/lib/ai/prompts";
import { decrypt } from "@/lib/crypto/encryption";
import { db } from "@/lib/db/prisma";
import { detectVice, extractBehaviorMeta } from "@/lib/vice/detectors";
import { fastExtract } from "@/lib/agents/fastExtract";
import type { ExtractedTransaction } from "@/types";

export class ExtractionAgent {
  async extractFromEmail(
    userId: string,
    emailId: string
  ): Promise<ExtractedTransaction[]> {
    const email = await db.financialEmail.findUnique({
      where: { id: emailId, userId },
      select: {
        encryptedBody: true,
        subject: true,
        sender: true,
        receivedAt: true,
      },
    });

    if (!email || !email.encryptedBody) return [];

    const body = decrypt(email.encryptedBody);

    // Zero-token fast path for known bank alert formats
    const fast = fastExtract(email.sender, email.subject ?? "", body);
    if (fast !== null) {
      return fast.map((tx) => {
        const vice = detectVice({ merchant: tx.merchant ?? "", description: tx.description ?? "", sender: email.sender ?? "", body });
        if (vice) return { ...tx, category: vice.type.toLowerCase() };
        return tx;
      });
    }

    const context = `
Date: ${email.receivedAt.toISOString()}
From: ${email.sender}
Subject: ${email.subject}

${body}`.trim();

    const extracted = await completeJSON<ExtractedTransaction[]>(
      EXTRACTOR_SYSTEM,
      context,
      { maxTokens: 512 }
    );

    const transactions = Array.isArray(extracted) ? extracted : [];

    // Override category with vice detection where applicable
    return transactions.map((tx) => {
      const vice = detectVice({
        merchant: tx.merchant ?? "",
        description: tx.description ?? "",
        sender: email.sender ?? "",
        body,
      });
      if (vice) {
        return { ...tx, category: vice.type.toLowerCase() };
      }
      return tx;
    });
  }

  async persistTransactions(
    userId: string,
    emailId: string,
    transactions: ExtractedTransaction[]
  ): Promise<number> {
    let created = 0;

    for (const tx of transactions) {
      if (!tx.amount || tx.amount <= 0) continue;

      const date = tx.date ? new Date(tx.date) : new Date();

      // Dedup: same email + same amount + same date + same type
      const existing = await db.transaction.findFirst({
        where: {
          userId,
          emailId,
          amount: tx.amount,
          type: tx.type,
          date: {
            gte: new Date(date.getTime() - 60_000),
            lte: new Date(date.getTime() + 60_000),
          },
        },
      });

      if (existing) continue;

      await db.transaction.create({
        data: {
          userId,
          emailId,
          amount: tx.amount,
          currency: tx.currency ?? "INR",
          type: tx.type,
          category: tx.category,
          description: tx.description,
          merchant: tx.merchant ?? null,
          account: tx.account ?? null,
          accountLast4: tx.accountLast4 ?? null,
          referenceId: tx.referenceId ?? null,
          date,
          confidence: tx.confidence,
          rawText: tx.rawText?.substring(0, 1000) ?? null,
          metadata: {},
        },
      });

      created++;
    }

    // Mark email as extracted
    await db.financialEmail.update({
      where: { id: emailId },
      data: { extracted: true },
    });

    return created;
  }

  async extractFromAttachments(
    userId: string,
    emailId: string
  ): Promise<ExtractedTransaction[]> {
    const PROCESSABLE = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/csv",
      "message/rfc822",
      "text/plain",
    ]);

    const attachments = await db.emailAttachment.findMany({
      where: { emailId, userId, processed: false, encryptedData: { not: null } },
    });

    const allTransactions: ExtractedTransaction[] = [];

    for (const att of attachments) {
      if (!PROCESSABLE.has(att.mimeType)) {
        await db.emailAttachment.update({
          where: { id: att.id },
          data: { processed: true, processingError: "unsupported mime type" },
        });
        continue;
      }

      try {
        const { decrypt } = await import("@/lib/crypto/encryption");
        const data = decrypt(att.encryptedData!);

        const userMessage = `Extract all financial transactions from this ${att.mimeType} attachment${att.filename ? ` (${att.filename})` : ""}.`;
        const raw = await completeWithAttachment(
          ATTACHMENT_EXTRACTOR_SYSTEM,
          userMessage,
          data,
          att.mimeType,
          { maxTokens: 8192 }
        );

        const parsed = JSON.parse(
          raw.trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
        ) as ExtractedTransaction[];

        allTransactions.push(...(Array.isArray(parsed) ? parsed : []));

        await db.emailAttachment.update({
          where: { id: att.id },
          data: { processed: true },
        });
      } catch (err) {
        await db.emailAttachment.update({
          where: { id: att.id },
          data: {
            processed: true,
            processingError: err instanceof Error ? err.message : "Unknown error",
          },
        });
      }
    }

    return allTransactions;
  }

  async processBatch(
    userId: string,
    emailIds: string[]
  ): Promise<{ processed: number; transactionsCreated: number }> {
    let processed = 0;
    let transactionsCreated = 0;

    // Process 3 emails at a time to balance speed vs rate limits
    const CONCURRENCY = 3;
    for (let i = 0; i < emailIds.length; i += CONCURRENCY) {
      const batch = emailIds.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(async (emailId) => {
          const [bodyTxns, attachmentTxns] = await Promise.all([
            this.extractFromEmail(userId, emailId),
            this.extractFromAttachments(userId, emailId),
          ]);
          return { emailId, txns: [...bodyTxns, ...attachmentTxns] };
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          const created = await this.persistTransactions(userId, result.value.emailId, result.value.txns);
          transactionsCreated += created;
          processed++;
        } else {
          const emailId = batch[batchResults.indexOf(result)]!;
          await db.financialEmail.update({
            where: { id: emailId },
            data: { extractionError: result.reason instanceof Error ? result.reason.message : "Unknown error" },
          });
        }
      }
    }

    return { processed, transactionsCreated };
  }
}
