import { fetchEmails, type GmailMessage, type GmailAttachment } from "@/lib/gmail/client";
import { GMAIL_FINANCE_QUERY } from "@/lib/gmail/filters";
import { encrypt, hash } from "@/lib/crypto/encryption";
import { ClassifierAgent } from "./ClassifierAgent";
import { ExtractionAgent } from "./ExtractionAgent";
import { InsightEngine } from "./InsightEngine";
import { db } from "@/lib/db/prisma";
import { audit } from "@/lib/security/audit";
import { subDays } from "date-fns";

interface SyncResult {
  emailsFetched: number;
  emailsNew: number;
  emailsFinancial: number;
  transactionsCreated: number;
  insightsGenerated: number;
  durationMs: number;
  error?: string;
}

export class EmailIngestionAgent {
  private classifier = new ClassifierAgent();
  private extractor = new ExtractionAgent();
  private insights = new InsightEngine();

  async sync(userId: string, fullSync = false): Promise<SyncResult> {
    const start = Date.now();

    await audit({ userId, action: "GMAIL_SYNC_START" });

    try {
      const result = await this.runSync(userId, fullSync);
      await audit({
        userId,
        action: "GMAIL_SYNC_COMPLETE",
        metadata: result as unknown as Record<string, unknown>,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      await audit({
        userId,
        action: "GMAIL_SYNC_ERROR",
        success: false,
        error,
      });
      return {
        emailsFetched: 0,
        emailsNew: 0,
        emailsFinancial: 0,
        transactionsCreated: 0,
        insightsGenerated: 0,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  private async runSync(userId: string, fullSync: boolean): Promise<SyncResult> {
    const start = Date.now();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { gmailSyncedAt: true },
    });

    // Build date-aware query
    const syncDaysBack = fullSync
      ? parseInt(process.env.GMAIL_INITIAL_SYNC_DAYS ?? "90")
      : 7;

    // Full sync always goes back syncDaysBack regardless of previous sync time
    const afterDate = (!fullSync && user?.gmailSyncedAt)
      ? Math.floor(user.gmailSyncedAt.getTime() / 1000)
      : Math.floor(subDays(new Date(), syncDaysBack).getTime() / 1000);

    const query = `${GMAIL_FINANCE_QUERY} after:${afterDate}`;
    const batchSize = parseInt(process.env.GMAIL_SYNC_BATCH_SIZE ?? "100");

    let emailsFetched = 0;
    let emailsNew = 0;
    let pageToken: string | undefined;

    const newEmailIds: string[] = [];

    // Fetch and store emails
    do {
      const { messages, nextPageToken } = await fetchEmails(
        userId,
        query,
        batchSize,
        pageToken
      );

      emailsFetched += messages.length;

      for (const msg of messages) {
        const stored = await this.storeEmail(userId, msg);
        if (stored) {
          emailsNew++;
          newEmailIds.push(stored);
        }
      }

      pageToken = nextPageToken;
    } while (pageToken && emailsNew < 500); // Safety cap

    // Classify new emails
    const classificationResults = await this.classifier.classifyBatch(
      userId,
      newEmailIds
    );
    await this.classifier.persistResults(userId, classificationResults);

    const financialEmailIds = newEmailIds.filter((id) => {
      const r = classificationResults.get(id);
      return r?.isFinancial && (r.confidence ?? 0) > 0.6;
    });

    const emailsFinancial = financialEmailIds.length;

    // Extract transactions
    const { transactionsCreated } = await this.extractor.processBatch(
      userId,
      financialEmailIds
    );

    // Generate insights
    let insightsGenerated = 0;
    if (transactionsCreated > 0) {
      insightsGenerated = await this.insights.generateMonthlyInsights(userId);
    }

    // Update sync timestamp
    await db.user.update({
      where: { id: userId },
      data: { gmailSyncedAt: new Date() },
    });

    return {
      emailsFetched,
      emailsNew,
      emailsFinancial,
      transactionsCreated,
      insightsGenerated,
      durationMs: Date.now() - start,
    };
  }

  private async storeEmail(
    userId: string,
    msg: GmailMessage
  ): Promise<string | null> {
    const existing = await db.financialEmail.findUnique({
      where: { gmailId: msg.id },
      select: { id: true },
    });

    if (existing) return null;

    const bodyHash = hash(msg.body || msg.snippet);
    const encryptedBody = msg.body ? encrypt(msg.body) : null;

    const email = await db.financialEmail.create({
      data: {
        userId,
        gmailId: msg.id,
        threadId: msg.threadId,
        subject: msg.subject,
        sender: msg.sender,
        senderName: msg.senderName,
        snippet: msg.snippet?.substring(0, 500) ?? null,
        receivedAt: msg.receivedAt,
        encryptedBody,
        bodyHash,
      },
    });

    if (msg.attachments.length > 0) {
      await this.storeAttachments(userId, email.id, msg.attachments);
    }

    return email.id;
  }

  private async storeAttachments(
    userId: string,
    emailId: string,
    attachments: GmailAttachment[]
  ): Promise<void> {
    for (const att of attachments) {
      await db.emailAttachment.create({
        data: {
          userId,
          emailId,
          gmailAttachmentId: att.gmailAttachmentId,
          filename: att.filename || null,
          mimeType: att.mimeType,
          size: att.size,
          encryptedData: encrypt(att.data),
        },
      });
    }
  }
}
