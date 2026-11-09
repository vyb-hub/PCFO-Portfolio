import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

const MandateSchema = z.object({
  type: z.enum(["CARD", "UPI"]),
  merchant: z.string().min(1),
  cardLast4: z.string().optional(),
  upiHandle: z.string().optional(),
  upiApp: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  mandateLimit: z.number().positive(),
  amount: z.number().optional(),
  currency: z.string().default("INR"),
  nextDebitDate: z.string().optional(),
  lastDebitDate: z.string().optional(),
  subscriptionId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as "CARD" | "UPI" | null;

  const mandates = await db.mandate.findMany({
    where: { userId, ...(type && { type }) },
    orderBy: [{ status: "asc" }, { nextDebitDate: "asc" }],
    include: { subscription: { select: { name: true, icon: true, subcategory: true } } },
  });

  const items = mandates.map((m) => ({
    id: m.id,
    type: m.type,
    merchant: m.merchant,
    cardLast4: m.cardLast4,
    upiHandle: m.upiHandle,
    upiApp: m.upiApp,
    frequency: m.frequency,
    mandateLimit: m.mandateLimit,
    amount: m.amount,
    currency: m.currency,
    nextDebitDate: m.nextDebitDate?.toISOString(),
    lastDebitDate: m.lastDebitDate?.toISOString(),
    status: m.status,
    createdDate: m.createdDate?.toISOString(),
    autoDetected: m.autoDetected,
    notes: m.notes,
    subscription: m.subscription,
  }));

  const cardMandates = items.filter((m) => m.type === "CARD");
  const upiMandates = items.filter((m) => m.type === "UPI");

  return NextResponse.json({ success: true, data: { cardMandates, upiMandates, total: items.length } });
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
  const parsed = MandateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const { nextDebitDate, lastDebitDate, ...rest } = parsed.data;
  const mandate = await db.mandate.create({
    data: {
      userId,
      ...rest,
      autoDetected: false,
      ...(nextDebitDate && { nextDebitDate: new Date(nextDebitDate) }),
      ...(lastDebitDate && { lastDebitDate: new Date(lastDebitDate) }),
    },
  });

  return NextResponse.json({ success: true, data: mandate });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as { id: string; status?: string };

  await db.mandate.updateMany({
    where: { id: body.id, userId },
    data: {
      ...(body.status && { status: body.status as never }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
