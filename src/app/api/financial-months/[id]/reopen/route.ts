import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClosingService, serializeForTransport, completionPercent } from "../../_shared";

/** Debug/admin-only — no dashboard button per charter. Requires
 * ENABLE_MONTH_REOPEN=true; the closing service itself has no notion of
 * this gate, it's enforced here at the route boundary only. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.ENABLE_MONTH_REOPEN !== "true") {
    return NextResponse.json({ success: false, error: "Not enabled" }, { status: 403 });
  }

  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const service = getClosingService();
    const month = await service.reopenMonth(userId, id);
    return NextResponse.json({
      success: true,
      data: serializeForTransport({ ...month, completionPercent: completionPercent(month) }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reopen month";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
