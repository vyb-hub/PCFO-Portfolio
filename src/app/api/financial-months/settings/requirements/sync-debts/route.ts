import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClosingService } from "../../../_shared";

/** Explicit, on-demand re-derive of loan requirements from currently active
 * Debt rows — no background sync, no cron infra exists in this codebase. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const service = getClosingService();
  const requirements = await service.syncDebtRequirements(userId);

  return NextResponse.json({ success: true, data: requirements });
}
