import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClosingService, serializeForTransport, completionPercent } from "../../_shared";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const month = await service.confirmSalary(userId, id);
    return NextResponse.json({
      success: true,
      data: serializeForTransport({ ...month, completionPercent: completionPercent(month) }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm salary";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
