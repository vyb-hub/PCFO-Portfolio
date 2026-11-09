import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { ClassifierAgent } from "@/lib/agents/ClassifierAgent";
import { ExtractionAgent } from "@/lib/agents/ExtractionAgent";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const classifier = new ClassifierAgent();
  const extractor = new ExtractionAgent();

  // Re-classify emails previously rejected by the pre-filter (non-financial, no extraction error)
  const misclassified = await db.financialEmail.findMany({
    where: { userId, isFinancial: false, encryptedBody: { not: null } },
    select: { id: true },
  });

  if (misclassified.length > 0) {
    // Reset so classifier runs fresh
    await db.financialEmail.updateMany({
      where: { id: { in: misclassified.map(e => e.id) } },
      data: { isFinancial: false, confidence: null, processedAt: null },
    });

    const classificationResults = await classifier.classifyBatch(
      userId,
      misclassified.map(e => e.id)
    );
    await classifier.persistResults(userId, classificationResults);
  }

  // Extract from ALL financial emails not yet successfully extracted
  const pending = await db.financialEmail.findMany({
    where: {
      userId,
      isFinancial: true,
      extracted: false,
      encryptedBody: { not: null },
    },
    select: { id: true },
  });

  await db.financialEmail.updateMany({
    where: { id: { in: pending.map(e => e.id) } },
    data: { extractionError: null },
  });

  const { transactionsCreated } = await extractor.processBatch(
    userId,
    pending.map(e => e.id)
  );

  return NextResponse.json({
    success: true,
    emailsReclassified: misclassified.length,
    emailsExtracted: pending.length,
    transactionsCreated,
  });
}
