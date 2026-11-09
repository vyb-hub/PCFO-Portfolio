import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { computeSubscriptionHealth } from "@/lib/subscriptions/analytics";
import { toMonthlyEquivalent, toYearlyEquivalent } from "@/lib/subscriptions/detector";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1),
  merchant: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  startDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  category: z.string().default("subscriptions"),
  subcategory: z.string().optional(),
  icon: z.string().optional(),
  paymentMethod: z.string().optional(),
  cardLast4: z.string().optional(),
  upiHandle: z.string().optional(),
  upiApp: z.string().optional(),
  autoRenew: z.boolean().default(true),
  isTrial: z.boolean().default(false),
  trialEndDate: z.string().optional(),
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
  const includeHealth = url.searchParams.get("health") === "true";

  const [subscriptions, health] = await Promise.all([
    db.subscription.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { nextDueDate: "asc" }, { amount: "desc" }],
    }),
    includeHealth ? computeSubscriptionHealth(userId) : Promise.resolve(null),
  ]);

  const items = subscriptions.map((s) => ({
    id: s.id,
    name: s.name,
    merchant: s.merchant,
    amount: s.amount,
    currency: s.currency,
    frequency: s.frequency,
    startDate: s.startDate?.toISOString(),
    nextDueDate: s.nextDueDate?.toISOString(),
    lastChargedAt: s.lastChargedAt?.toISOString(),
    isActive: s.isActive,
    status: s.status,
    category: s.category,
    subcategory: s.subcategory,
    icon: s.icon,
    autoRenew: s.autoRenew,
    usageConfidence: s.usageConfidence,
    paymentMethod: s.paymentMethod,
    cardLast4: s.cardLast4,
    upiHandle: s.upiHandle,
    upiApp: s.upiApp,
    isTrial: s.isTrial,
    trialEndDate: s.trialEndDate?.toISOString(),
    priceChangedFrom: s.priceChangedFrom,
    notes: s.notes,
    monthlyEquivalent: toMonthlyEquivalent(s.amount, s.frequency),
    yearlyEquivalent: toYearlyEquivalent(s.amount, s.frequency),
  }));

  return NextResponse.json({ success: true, data: { items, health } });
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
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const { startDate, nextDueDate, trialEndDate, ...rest } = parsed.data;
  const sub = await db.subscription.create({
    data: {
      userId,
      ...rest,
      detectedFrom: "MANUAL",
      ...(startDate && { startDate: new Date(startDate) }),
      ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
      ...(trialEndDate && { trialEndDate: new Date(trialEndDate) }),
    },
  });

  return NextResponse.json({ success: true, data: sub });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as { id: string; status?: string; isActive?: boolean; amount?: number };

  await db.subscription.updateMany({
    where: { id: body.id, userId },
    data: {
      ...(body.status && { status: body.status as never }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.amount !== undefined && { amount: body.amount }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  await db.subscription.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
