import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";
import { computeSubscriptionHealth } from "@/lib/subscriptions/analytics";
import { completeJSON } from "@/lib/ai/claude";
import { SUBSCRIPTION_INSIGHT_SYSTEM } from "@/lib/ai/prompts";
import { toMonthlyEquivalent } from "@/lib/subscriptions/detector";
import { format } from "date-fns";

export interface SubscriptionInsight {
  id: string;
  category: string;
  title: string;
  body: string;
  severity: "INFO" | "WARNING" | "ALERT";
  services: string[];
  missionImpact: string | null;
  actionable: boolean;
}

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const [subscriptions, mandates, health] = await Promise.all([
    db.subscription.findMany({ where: { userId } }),
    db.mandate.findMany({ where: { userId } }),
    computeSubscriptionHealth(userId),
  ]);

  const context = JSON.stringify({
    subscriptions: subscriptions.map((s) => ({
      name: s.name,
      subcategory: s.subcategory,
      amount: s.amount,
      frequency: s.frequency,
      status: s.status,
      isActive: s.isActive,
      usageConfidence: s.usageConfidence,
      lastChargedAt: s.lastChargedAt ? format(s.lastChargedAt, "yyyy-MM-dd") : null,
      nextDueDate: s.nextDueDate ? format(s.nextDueDate, "yyyy-MM-dd") : null,
      isTrial: s.isTrial,
      trialEndDate: s.trialEndDate ? format(s.trialEndDate, "yyyy-MM-dd") : null,
      priceChangedFrom: s.priceChangedFrom,
      monthlyEquivalent: toMonthlyEquivalent(s.amount, s.frequency),
    })),
    mandates: mandates.map((m) => ({
      merchant: m.merchant,
      type: m.type,
      status: m.status,
      mandateLimit: m.mandateLimit,
      frequency: m.frequency,
      nextDebitDate: m.nextDebitDate ? format(m.nextDebitDate, "yyyy-MM-dd") : null,
    })),
    health: {
      monthlyBurden: health.monthlyBurden,
      yearlyBurden: health.yearlyBurden,
      activeCount: health.activeCount,
      dormantCount: health.dormantCount,
      duplicateGroups: health.duplicateGroups,
      upcomingRenewals: health.upcomingRenewals.slice(0, 5),
      categoryBreakdown: health.categoryBreakdown,
    },
    missionContext: {
      savingsGoal: 500000,
      note: "Reducing subscription waste accelerates the ₹5L savings mission",
    },
  });

  try {
    const insights = await completeJSON<SubscriptionInsight[]>(
      SUBSCRIPTION_INSIGHT_SYSTEM,
      context,
      { maxTokens: 2500 }
    );
    return NextResponse.json({ success: true, data: insights });
  } catch (err) {
    if (err instanceof Error && err.message === "AI_DISABLED") {
      return NextResponse.json({ success: false, error: "AI features require ANTHROPIC_API_KEY" }, { status: 503 });
    }
    throw err;
  }
}
