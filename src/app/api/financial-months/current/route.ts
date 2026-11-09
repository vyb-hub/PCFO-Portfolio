import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClosingService, serializeForTransport, completionPercent } from "../_shared";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const service = getClosingService();
  const [month, latestClosed] = await Promise.all([
    service.getOrCreateCurrentMonth(userId),
    service.getLatestClosedMonth(userId),
  ]);

  return NextResponse.json({
    success: true,
    data: serializeForTransport({
      month: { ...month, completionPercent: completionPercent(month) },
      latestClosed: latestClosed ? { periodLabel: latestClosed.periodLabel, closedAt: latestClosed.closedAt } : null,
    }),
  });
}
