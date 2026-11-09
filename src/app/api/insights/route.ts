import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { InsightEngine } from "@/lib/agents/InsightEngine";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const insights = await db.insight.findMany({
    where: { userId, dismissed: false },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await db.insight.count({
    where: { userId, dismissed: false },
  });

  return NextResponse.json({
    success: true,
    data: {
      items: insights.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        body: i.body,
        severity: i.severity,
        period: i.period,
        createdAt: i.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
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

  try {
    const engine = new InsightEngine();
    const count = await engine.generateMonthlyInsights(userId);
    return NextResponse.json({ success: true, data: { insightsGenerated: count } });
  } catch (err) {
    if (err instanceof Error && err.message === "AI_DISABLED") {
      return NextResponse.json({ success: false, error: "AI features require ANTHROPIC_API_KEY" }, { status: 503 });
    }
    throw err;
  }
}

const DismissSchema = z.object({ id: z.string() });

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as unknown;
  const parsed = DismissSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  await db.insight.updateMany({
    where: { id: parsed.data.id, userId },
    data: { dismissed: true },
  });

  return NextResponse.json({ success: true });
}
