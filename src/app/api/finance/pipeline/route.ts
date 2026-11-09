import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { createDefaultFinancialStateService } from "@/lib/finance/pipeline";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const financialState = createDefaultFinancialStateService(db);
    const result = await financialState.getPipelineResult(userId);

    // Convert Date objects → ISO strings for JSON transport.
    // JSON.stringify replacer walks every value; Date → string avoids
    // "[object Object]" and keeps the output deterministically parseable.
    const serialized = JSON.parse(
      JSON.stringify(result, (_key, value: unknown) =>
        value instanceof Date ? value.toISOString() : value,
      ),
    ) as unknown;

    return NextResponse.json({ success: true, data: serialized });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline error";
    const stack   = err instanceof Error ? err.stack : String(err);
    console.error("[pipeline] error:", message, stack);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
