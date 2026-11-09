import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { decrypt } from "@/lib/crypto/encryption";
import { completeJSON } from "@/lib/ai/claude";
import { EXTRACTOR_SYSTEM } from "@/lib/ai/prompts";
import type { ExtractedTransaction } from "@/types";

// GET /api/gmail/debug-extract?emailId=<id>
// Shows the decrypted body and raw Gemini extraction result for one email
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const emailId = req.nextUrl.searchParams.get("emailId");

  if (!emailId) {
    // List available email IDs
    const emails = await db.financialEmail.findMany({
      where: { userId },
      select: { id: true, subject: true },
    });
    return NextResponse.json({ emails });
  }

  const email = await db.financialEmail.findUnique({
    where: { id: emailId, userId },
    select: {
      encryptedBody: true,
      subject: true,
      sender: true,
      receivedAt: true,
    },
  });

  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });
  if (!email.encryptedBody) return NextResponse.json({ error: "No body stored" });

  const body = decrypt(email.encryptedBody);
  const context = `Date: ${email.receivedAt.toISOString()}
From: ${email.sender}
Subject: ${email.subject}

${body}`.trim();

  let aiResult: unknown = null;
  let aiError: string | null = null;

  try {
    aiResult = await completeJSON<ExtractedTransaction[]>(EXTRACTOR_SYSTEM, context, { maxTokens: 2048 });
  } catch (err) {
    aiError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    subject: email.subject,
    sender: email.sender,
    bodyPreview: body.substring(0, 1000),
    bodyLength: body.length,
    aiResult,
    aiError,
  });
}
