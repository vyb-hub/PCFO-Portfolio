import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { rateLimit } from "@/lib/security/rateLimit";
import { NotReadyToCloseError, ChecklistItemStatus } from "@/lib/finance/financial-closing";
import { getClosingService, serializeForTransport } from "../../_shared";

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
    const month = await service.closeMonth(userId, id);
    return NextResponse.json({ success: true, data: serializeForTransport(month) });
  } catch (err) {
    if (err instanceof NotReadyToCloseError) {
      const missingItems = err.month.checklistItems
        .filter(i => i.status === ChecklistItemStatus.PENDING)
        .map(i => i.label);
      return NextResponse.json(
        {
          success: false,
          error: "NOT_READY_TO_CLOSE",
          data: { missingItems, salaryConfirmed: err.month.salaryConfirmed },
        },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Failed to close month";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
