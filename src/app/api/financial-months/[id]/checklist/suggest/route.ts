import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClosingService, serializeForTransport, mapStatementAccountType } from "../../../_shared";

/**
 * "Which checklist item (if any) does this uploaded statement best match?" —
 * upload-centric, not item-scoped, matching StatementMatcher.suggestMatch()'s
 * actual shape (it scores one upload against every PENDING item on the
 * month, not one item at a time). Returns null when there's no confident
 * suggestion — never a forced guess (see the "upload matching" fork, ADR-021).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id: monthId } = await params;
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ success: false, error: "uploadId query param required" }, { status: 400 });
  }

  const upload = await db.statementUpload.findFirst({ where: { id: uploadId, userId } });
  if (!upload) {
    return NextResponse.json({ success: false, error: "Statement upload not found" }, { status: 404 });
  }

  const service = getClosingService();
  const month = await service.getMonth(userId, monthId);
  if (!month) {
    return NextResponse.json({ success: false, error: "Financial month not found" }, { status: 404 });
  }

  const suggestion = service.suggestMatchForUpload(month, {
    accountType: mapStatementAccountType(upload.accountType),
    institutionName: upload.institutionName,
  });

  return NextResponse.json({ success: true, data: serializeForTransport(suggestion) });
}
