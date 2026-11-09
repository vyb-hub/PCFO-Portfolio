import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { CATEGORY_META } from "@/lib/utils/categories";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  type: z.enum(["DEBIT", "CREDIT", "TRANSFER", "REFUND"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
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

  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const { page, limit, category, type, from, to, search } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ignored: false,
    ...(category && { category }),
    ...(type && { type }),
    ...(from || to
      ? {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        { merchant: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    db.transaction.count({ where }),
  ]);

  const items = transactions.map((tx) => {
    const meta = CATEGORY_META[tx.category] ?? CATEGORY_META["other"]!;
    return {
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type,
      category: tx.category,
      categoryDisplay: meta.name,
      categoryIcon: meta.icon,
      categoryColor: meta.color,
      description: tx.description,
      merchant: tx.merchant,
      account: tx.account,
      accountLast4: tx.accountLast4,
      date: tx.date.toISOString(),
      isRecurring: tx.isRecurring,
      confidence: tx.confidence,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      hasMore: skip + transactions.length < total,
    },
  });
}
