import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { computeMissionState } from "@/lib/mission/calculator";
import { generateStrategies } from "@/lib/mission/strategy";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const state = await computeMissionState(userId);

  try {
    const strategies = await generateStrategies(state);
    return NextResponse.json({ success: true, data: strategies });
  } catch (err) {
    if (err instanceof Error && err.message === "AI_DISABLED") {
      return NextResponse.json({ success: false, error: "AI features require ANTHROPIC_API_KEY" }, { status: 503 });
    }
    throw err;
  }
}
