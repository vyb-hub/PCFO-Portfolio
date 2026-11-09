import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";
import { PrismaStatementRequirementRepository } from "@/lib/infrastructure/repositories";
import { RequiredStatementType } from "@/lib/finance/financial-closing";

const CreateSchema = z.object({
  label: z.string().min(1),
  statementType: z.nativeEnum(RequiredStatementType),
});

const DeactivateSchema = z.object({ id: z.string().min(1) });

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const repo = new PrismaStatementRequirementRepository(db);
  const requirements = await repo.listActive(userId);

  return NextResponse.json({ success: true, data: requirements });
}

/** Manual requirements only (bank/credit card/investment/other) — loan
 * requirements come from POST /settings/requirements/sync-debts, not here. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const repo = new PrismaStatementRequirementRepository(db);
  const requirement = await repo.create({
    userId,
    label: parsed.data.label,
    statementType: parsed.data.statementType,
    linkedDebtId: null,
    autoManaged: false,
    isActive: true,
  });

  return NextResponse.json({ success: true, data: requirement });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as unknown;
  const parsed = DeactivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const repo = new PrismaStatementRequirementRepository(db);
  await repo.deactivate(userId, parsed.data.id);

  return NextResponse.json({ success: true });
}
