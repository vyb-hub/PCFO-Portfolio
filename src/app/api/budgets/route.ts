import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { CATEGORY_META } from "@/lib/utils/categories";
import {
  startOfMonth, endOfMonth, format,
  parseISO,
} from "date-fns";
import { z } from "zod";

const BudgetSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  const targetDate = monthParam ? parseISO(`${monthParam}-01`) : new Date();
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  const [budgets, transactions] = await Promise.all([
    db.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { category: "asc" },
    }),
    db.transaction.findMany({
      where: {
        userId,
        type: "DEBIT",
        ignored: false,
        date: { gte: start, lte: end },
      },
      select: { category: true, amount: true },
    }),
  ]);

  // Aggregate spend by category for the month
  const spendMap = new Map<string, number>();
  for (const tx of transactions) {
    spendMap.set(tx.category, (spendMap.get(tx.category) ?? 0) + tx.amount);
  }

  const items = budgets.map((b) => {
    const spent = spendMap.get(b.category) ?? 0;
    const pct = Math.round((spent / b.amount) * 100);
    const meta = CATEGORY_META[b.category];
    const remaining = b.amount - spent;
    const daysInMonth = end.getDate();
    const today = new Date().getDate();
    const daysLeft = Math.max(0, daysInMonth - today);
    const dailyBudget = remaining > 0 && daysLeft > 0 ? remaining / daysLeft : 0;

    return {
      id: b.id,
      category: b.category,
      name: meta?.name ?? b.category,
      icon: meta?.icon ?? "💰",
      color: meta?.color ?? "#7c3aed",
      amount: b.amount,
      currency: b.currency,
      period: b.period,
      spent,
      remaining,
      pct,
      over: spent > b.amount,
      dailyBudget,
      daysLeft,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate?.toISOString(),
    };
  });

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);
  const overBudgetCount = items.filter((i) => i.over).length;

  return NextResponse.json({
    success: true,
    data: {
      items,
      month: format(targetDate, "yyyy-MM"),
      totalBudget,
      totalSpent,
      overBudgetCount,
    },
  });
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
  const parsed = BudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const { startDate, endDate, ...rest } = parsed.data;

  // Deactivate any existing active budget for this category + period
  await db.budget.updateMany({
    where: { userId, category: rest.category, period: rest.period, isActive: true },
    data: { isActive: false },
  });

  const budget = await db.budget.create({
    data: {
      userId,
      ...rest,
      startDate: parseISO(startDate),
      ...(endDate && { endDate: parseISO(endDate) }),
    },
  });

  return NextResponse.json({ success: true, data: budget });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as { id: string; amount?: number; isActive?: boolean };

  await db.budget.updateMany({
    where: { id: body.id, userId },
    data: {
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
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

  await db.budget.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
