import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import {
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCode,
  encryptSecret,
} from "@/lib/security/totp";
import { audit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const email = session.user.email!;

  const secret = generateTOTPSecret();
  const uri = generateTOTPUri(secret, email);
  const qrCode = await generateQRCode(uri);

  // Temporarily store unencrypted secret for verification step
  await db.user.update({
    where: { id: userId },
    data: { totpSecret: encryptSecret(secret) },
  });

  await audit({ userId, action: "AUTH_MFA_SETUP", request: req });

  return NextResponse.json({
    success: true,
    data: { qrCode, secret, uri },
  });
}
