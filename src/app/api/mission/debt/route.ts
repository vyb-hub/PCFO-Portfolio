import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

const DebtSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["HOME_LOAN","CAR_LOAN","PERSONAL_LOAN","CREDIT_CARD","EDUCATION_LOAN","BNPL","OTHER"]),
  principalAmount: z.number().positive(),
  currentBalance: z.number().min(0),
  emiAmount: z.number().optional(),
  interestRate: z.number().optional(),
  lender: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const debts = await db.debt.findMany({
    where: { userId, isActive: true },
    orderBy: { currentBalance: "desc" },
  });

  return NextResponse.json({ success: true, data: debts });
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as unknown;
  const parsed = DebtSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const debt = await db.debt.create({
    data: { userId, ...parsed.data },
  });

  return NextResponse.json({ success: true, data: debt });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as { id: string; currentBalance?: number; isActive?: boolean };

  await db.debt.updateMany({
    where: { id: body.id, userId },
    data: {
      ...(body.currentBalance !== undefined && { currentBalance: body.currentBalance }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
