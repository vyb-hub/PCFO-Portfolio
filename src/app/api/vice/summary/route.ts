import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getBehavioralSummary } from "@/lib/vice/analytics";
import { rateLimit } from "@/lib/security/rateLimit";

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
  const targetDate = monthParam ? new Date(`${monthParam}-01`) : new Date();

  const summary = await getBehavioralSummary(userId, targetDate);

  return NextResponse.json({ success: true, data: summary });
}
