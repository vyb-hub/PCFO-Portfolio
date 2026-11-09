import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { reconcileWalletTransactions } from "@/lib/analyzer/walletReconciliation";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const result = await reconcileWalletTransactions(userId);
  return NextResponse.json({ success: true, result });
}
