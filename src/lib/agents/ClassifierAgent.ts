import { completeJSON } from "@/lib/ai/claude";
import { CLASSIFIER_SYSTEM } from "@/lib/ai/prompts";
import { quickFinanceFilter } from "@/lib/gmail/filters";
import { db } from "@/lib/db/prisma";
import type { EmailCategory } from "@prisma/client";

interface ClassificationResult {
  isFinancial: boolean;
  confidence: number;
  category: EmailCategory | null;
  reason: string;
}

export class ClassifierAgent {
  /**
   * Classifies a batch of emails. Pre-filters with regex before hitting AI
   * to minimize Claude API usage.
   */
  async classifyBatch(
    userId: string,
    emailIds: string[]
  ): Promise<Map<string, ClassificationResult>> {
    const results = new Map<string, ClassificationResult>();

    const emails = await db.financialEmail.findMany({
      where: { id: { in: emailIds }, userId },
      select: { id: true, sender: true, subject: true, snippet: true },
    });

    // Separate pre-filter rejects (no AI needed) from those needing AI
    const needsAI = emails.filter((email) =>
      quickFinanceFilter({ sender: email.sender, subject: email.subject, snippet: email.snippet ?? "" })
    );
    const rejected = emails.filter((email) =>
      !quickFinanceFilter({ sender: email.sender, subject: email.subject, snippet: email.snippet ?? "" })
    );

    for (const email of rejected) {
      results.set(email.id, {
        isFinancial: false,
        confidence: 0.95,
        category: null,
        reason: "Did not match any finance sender or subject pattern",
      });
    }

    // Classify AI-eligible emails in parallel (3 at a time to avoid rate limits)
    const CONCURRENCY = 3;
    for (let i = 0; i < needsAI.length; i += CONCURRENCY) {
      const batch = needsAI.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (email) => {
          const result = await this.classifySingle(email.sender, email.subject, email.snippet ?? "");
          results.set(email.id, result);
        })
      );
    }

    return results;
  }

  async classifySingle(
    sender: string,
    subject: string,
    snippet: string
  ): Promise<ClassificationResult> {
    try {
      const result = await completeJSON<ClassificationResult>(
        CLASSIFIER_SYSTEM,
        `Sender: ${sender}\nSubject: ${subject}\nSnippet: ${snippet.substring(0, 300)}`,
        { maxTokens: 256 }
      );
      return {
        isFinancial: result.isFinancial,
        confidence: Math.min(1, Math.max(0, result.confidence)),
        category: result.category as EmailCategory | null,
        reason: result.reason,
      };
    } catch {
      // Fallback to pattern-based classification
      const quickPass = quickFinanceFilter({ sender, subject, snippet });
      return {
        isFinancial: quickPass,
        confidence: quickPass ? 0.75 : 0.1,
        category: null,
        reason: "AI classification failed — fallback to pattern matching",
      };
    }
  }

  async persistResults(
    userId: string,
    results: Map<string, ClassificationResult>
  ): Promise<void> {
    for (const [emailId, result] of results) {
      await db.financialEmail.update({
        where: { id: emailId, userId },
        data: {
          isFinancial: result.isFinancial,
          confidence: result.confidence,
          category: result.category ?? undefined,
          processedAt: new Date(),
        },
      });
    }
  }
}
