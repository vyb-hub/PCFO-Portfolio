import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const statements = await db.statementUpload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      institutionName: true,
      accountType: true,
      accountNumber: true,
      periodFrom: true,
      periodTo: true,
      totalDebits: true,
      totalCredits: true,
      closingBalance: true,
      creditLimit: true,
      minimumDue: true,
      totalDue: true,
      currency: true,
      status: true,
      processingError: true,
      transactionCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, statements });
}
