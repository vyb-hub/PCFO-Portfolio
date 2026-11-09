import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getAuthorizedClient } from "@/lib/gmail/client";
import { GMAIL_FINANCE_QUERY } from "@/lib/gmail/filters";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const gmail = await getAuthorizedClient(userId);

  const afterDate = Math.floor(subDays(new Date(), 90).getTime() / 1000);
  const fullQuery = `${GMAIL_FINANCE_QUERY} after:${afterDate}`;

  // Also try a bare query with no filters to see total reachable emails
  const bareResult = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });

  // Run the actual finance query
  const financeResult = await gmail.users.messages.list({
    userId: "me",
    q: fullQuery,
    maxResults: 10,
  });

  // Try just "debited" to isolate keyword matching
  const debitedResult = await gmail.users.messages.list({
    userId: "me",
    q: "debited",
    maxResults: 10,
  });

  const { db } = await import("@/lib/db/prisma");

  // Show classification + extraction state of stored emails
  const storedEmails = await db.financialEmail.findMany({
    where: { userId },
    select: {
      id: true,
      subject: true,
      sender: true,
      isFinancial: true,
      confidence: true,
      extracted: true,
      extractionError: true,
      encryptedBody: true,
    },
  });

  const transactionCount = await db.transaction.count({ where: { userId } });

  return NextResponse.json({
    query: fullQuery,
    bareEmailsFound: bareResult.data.resultSizeEstimate,
    financeQueryMatches: financeResult.data.resultSizeEstimate,
    debitedOnlyMatches: debitedResult.data.resultSizeEstimate,
    transactionCount,
    storedEmails: storedEmails.map(e => ({
      id: e.id,
      subject: e.subject,
      sender: e.sender,
      isFinancial: e.isFinancial,
      confidence: e.confidence,
      extracted: e.extracted,
      extractionError: e.extractionError,
      hasBody: e.encryptedBody !== null,
    })),
  });
}
