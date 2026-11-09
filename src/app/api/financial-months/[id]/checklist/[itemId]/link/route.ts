import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";
import { getClosingService, serializeForTransport, completionPercent } from "../../../../_shared";

const LinkSchema = z.object({ statementUploadId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id: monthId, itemId } = await params;
  const body = await req.json() as unknown;
  const parsed = LinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  try {
    const service = getClosingService();
    const month = await service.linkUpload(userId, monthId, itemId, parsed.data.statementUploadId);
    return NextResponse.json({
      success: true,
      data: serializeForTransport({ ...month, completionPercent: completionPercent(month) }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to link statement";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
