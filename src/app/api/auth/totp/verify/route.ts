import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { verifyTOTP } from "@/lib/security/totp";
import { audit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

const VerifySchema = z.object({ token: z.string().length(6).regex(/^\d+$/) });

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as unknown;
  const parsed = VerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid token format" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpSecret) {
    return NextResponse.json({ success: false, error: "MFA not configured" }, { status: 400 });
  }

  const valid = verifyTOTP(parsed.data.token, user.totpSecret);

  if (!valid) {
    await audit({
      userId,
      action: "AUTH_MFA_FAIL",
      success: false,
      request: req,
    });
    return NextResponse.json({ success: false, error: "Invalid code" }, { status: 401 });
  }

  // Enable TOTP if this is the setup flow
  if (!user.totpEnabled) {
    await db.user.update({
      where: { id: userId },
      data: { totpEnabled: true, totpVerifiedAt: new Date() },
    });
  }

  await audit({ userId, action: "AUTH_MFA_VERIFY", request: req });

  return NextResponse.json({ success: true, data: { mfaVerified: true } });
}
