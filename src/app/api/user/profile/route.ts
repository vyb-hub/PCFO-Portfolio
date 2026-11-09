import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import {
  encryptPAN,
  encryptDOB, decryptDOB,
  encryptBankCustomerIds, decryptBankCustomerIds,
  encryptBankAccountNos, decryptBankAccountNos,
} from "@/lib/crypto/encryption";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, encryptedDOB: true, encryptedPAN: true, encryptedBankCustomerIds: true, encryptedBankAccountNos: true },
  });

  return NextResponse.json({
    name: user?.name ?? null,
    dateOfBirth: user?.encryptedDOB ? decryptDOB(user.encryptedDOB).toISOString().substring(0, 10) : null,
    panSet: !!user?.encryptedPAN,
    bankCustomerIds: user?.encryptedBankCustomerIds ? decryptBankCustomerIds(user.encryptedBankCustomerIds) : {},
    bankAccountNos: user?.encryptedBankAccountNos ? decryptBankAccountNos(user.encryptedBankAccountNos) : {},
  });
}

export async function PUT(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    name?: string | null;
    dateOfBirth?: string | null;
    pan?: string | null;
    clearPAN?: boolean;
    bankCustomerIds?: Record<string, string>;
    bankAccountNos?: Record<string, string>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.name !== undefined) {
    data.name = body.name?.trim() || null;
  }

  if (body.dateOfBirth !== undefined) {
    data.encryptedDOB = body.dateOfBirth ? encryptDOB(new Date(body.dateOfBirth)) : null;
  }

  if (body.clearPAN) {
    data.encryptedPAN = null;
  } else if (body.pan?.trim()) {
    data.encryptedPAN = encryptPAN(body.pan.trim().toUpperCase());
  }

  if (body.bankCustomerIds !== undefined) {
    const clean = Object.fromEntries(Object.entries(body.bankCustomerIds).filter(([, v]) => v?.trim()));
    data.encryptedBankCustomerIds = Object.keys(clean).length ? encryptBankCustomerIds(clean) : null;
  }

  if (body.bankAccountNos !== undefined) {
    const clean = Object.fromEntries(Object.entries(body.bankAccountNos).filter(([, v]) => v?.trim()));
    data.encryptedBankAccountNos = Object.keys(clean).length ? encryptBankAccountNos(clean) : null;
  }

  await db.user.update({ where: { id: userId }, data });

  return NextResponse.json({ success: true });
}
