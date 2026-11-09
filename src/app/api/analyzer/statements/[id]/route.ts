import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const statement = await db.statementUpload.findUnique({ where: { id } });
  if (!statement || statement.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete linked transactions first, then the statement
  await db.transaction.deleteMany({ where: { statementId: id } });
  await db.statementUpload.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
