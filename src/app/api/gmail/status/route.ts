import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { getAuthorizedClient } from "@/lib/gmail/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { encryptedTokens: true, gmailSyncedAt: true, email: true },
  });

  if (!user?.encryptedTokens) {
    return NextResponse.json({
      success: false,
      error: "No Gmail tokens stored. Try logging out and back in.",
      hasTokens: false,
    });
  }

  try {
    const gmail = await getAuthorizedClient(userId);
    const profile = await gmail.users.getProfile({ userId: "me" });

    const [emailCount, txCount] = await Promise.all([
      db.financialEmail.count({ where: { userId } }),
      db.transaction.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      success: true,
      hasTokens: true,
      gmailConnected: true,
      gmailAddress: profile.data.emailAddress,
      messagesTotal: profile.data.messagesTotal,
      lastSyncAt: user.gmailSyncedAt?.toISOString() ?? null,
      emailsInDb: emailCount,
      transactionsInDb: txCount,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      hasTokens: true,
      gmailConnected: false,
      error: err instanceof Error ? err.message : "Gmail API error",
    });
  }
}
