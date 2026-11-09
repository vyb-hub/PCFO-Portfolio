import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { EmailIngestionAgent } from "@/lib/agents/EmailIngestionAgent";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({})) as { full?: boolean };
  const fullSync = body.full === true;

  const agent = new EmailIngestionAgent();
  const result = await agent.sync(userId, fullSync);

  return NextResponse.json({
    success: !result.error,
    data: result,
  });
}

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await import("@/lib/db/prisma");
  const userId = (session.user as { id: string }).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { gmailSyncedAt: true },
  });

  const [emailCount, txCount] = await Promise.all([
    db.financialEmail.count({ where: { userId, isFinancial: true } }),
    db.transaction.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      lastSyncAt: user?.gmailSyncedAt?.toISOString() ?? null,
      emailsProcessed: emailCount,
      transactionsExtracted: txCount,
      isRunning: false,
    },
  });
}
