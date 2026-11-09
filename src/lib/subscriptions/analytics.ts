// ============================================================
// Subscription Analytics — health scores, dormancy, duplicates
// ============================================================

import { db } from "@/lib/db/prisma";
import { toMonthlyEquivalent, toYearlyEquivalent } from "./detector";
import { addDays, differenceInDays, isBefore, isAfter, startOfDay } from "date-fns";

export interface SubscriptionHealth {
  healthScore: number;        // 0–100 (100 = no waste)
  wasteScore: number;         // 0–100 (100 = all subscriptions are waste)
  dormancyScore: number;      // 0–100 (100 = everything dormant)
  complexityRating: string;   // "Low", "Medium", "High Chaos"
  monthlyBurden: number;
  yearlyBurden: number;
  activeCount: number;
  dormantCount: number;
  expiredCount: number;
  upcomingRenewals: UpcomingRenewal[];
  duplicateGroups: DuplicateGroup[];
  dormantItems: string[];
  categoryBreakdown: CategoryEntry[];
}

export interface UpcomingRenewal {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDueDate: Date;
  daysUntil: number;
  isUrgent: boolean;          // within 7 days
  icon?: string;
}

export interface DuplicateGroup {
  subcategory: string;
  items: { id: string; name: string; amount: number; frequency: string }[];
  totalMonthly: number;
}

export interface CategoryEntry {
  category: string;
  subcategory?: string;
  count: number;
  monthlyTotal: number;
  icon?: string;
}

export async function computeSubscriptionHealth(
  userId: string
): Promise<SubscriptionHealth> {
  const [subscriptions, mandates] = await Promise.all([
    db.subscription.findMany({ where: { userId } }),
    db.mandate.findMany({ where: { userId, status: "ACTIVE" } }),
  ]);

  const now = startOfDay(new Date());
  const active = subscriptions.filter((s) => s.isActive && s.status !== "EXPIRED" && s.status !== "CANCELLED");
  const dormant = subscriptions.filter((s) => s.status === "DORMANT");
  const expired = subscriptions.filter((s) => !s.isActive || s.status === "EXPIRED" || s.status === "CANCELLED");

  // Monthly / yearly burden
  const monthlyBurden = active.reduce(
    (sum, s) => sum + toMonthlyEquivalent(s.amount, s.frequency),
    0
  );
  const yearlyBurden = active.reduce(
    (sum, s) => sum + toYearlyEquivalent(s.amount, s.frequency),
    0
  );

  // Upcoming renewals (next 30 days)
  const upcomingRenewals: UpcomingRenewal[] = active
    .filter((s) => s.nextDueDate)
    .map((s) => {
      const due = new Date(s.nextDueDate!);
      const daysUntil = differenceInDays(due, now);
      return {
        id: s.id,
        name: s.name,
        amount: s.amount,
        frequency: s.frequency,
        nextDueDate: due,
        daysUntil,
        isUrgent: daysUntil <= 7 && daysUntil >= 0,
        icon: s.icon ?? undefined,
      };
    })
    .filter((r) => r.daysUntil >= 0 && r.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Duplicate detection — group by subcategory, flag if >1 in same subcategory
  const bySubcategory = new Map<string, typeof active>();
  for (const s of active) {
    const key = s.subcategory ?? s.category ?? "Other";
    if (!bySubcategory.has(key)) bySubcategory.set(key, []);
    bySubcategory.get(key)!.push(s);
  }

  const duplicateGroups: DuplicateGroup[] = [];
  for (const [subcat, items] of bySubcategory.entries()) {
    if (items.length > 1) {
      const OVERLAP_CATEGORIES = ["Streaming", "Music", "Cloud Storage", "AI Tools"];
      if (OVERLAP_CATEGORIES.includes(subcat)) {
        duplicateGroups.push({
          subcategory: subcat,
          items: items.map((s) => ({
            id: s.id,
            name: s.name,
            amount: s.amount,
            frequency: s.frequency,
          })),
          totalMonthly: items.reduce(
            (sum, s) => sum + toMonthlyEquivalent(s.amount, s.frequency),
            0
          ),
        });
      }
    }
  }

  // Category breakdown
  const catMap = new Map<string, { count: number; monthly: number; icon?: string }>();
  for (const s of active) {
    const key = s.subcategory ?? s.category ?? "Other";
    const monthly = toMonthlyEquivalent(s.amount, s.frequency);
    const existing = catMap.get(key) ?? { count: 0, monthly: 0, icon: s.icon ?? undefined };
    catMap.set(key, { count: existing.count + 1, monthly: existing.monthly + monthly });
  }
  const categoryBreakdown: CategoryEntry[] = Array.from(catMap.entries())
    .map(([k, v]) => ({ category: k, subcategory: k, count: v.count, monthlyTotal: v.monthly }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  // Scores
  const dormantRatio = active.length > 0 ? dormant.length / active.length : 0;
  const dormancyScore = Math.round(dormantRatio * 100);

  const wasteMonthly = dormant.reduce(
    (sum, s) => sum + toMonthlyEquivalent(s.amount, s.frequency),
    0
  );
  const wasteScore =
    monthlyBurden > 0 ? Math.round((wasteMonthly / monthlyBurden) * 100) : 0;

  const dupPenalty = Math.min(30, duplicateGroups.length * 10);
  const dormPenalty = Math.min(40, dormancyScore * 0.4);
  const healthScore = Math.max(0, 100 - dupPenalty - dormPenalty);

  const complexityRating =
    active.length >= 15
      ? "High Chaos"
      : active.length >= 8
      ? "Medium"
      : "Low";

  return {
    healthScore,
    wasteScore,
    dormancyScore,
    complexityRating,
    monthlyBurden,
    yearlyBurden,
    activeCount: active.length,
    dormantCount: dormant.length,
    expiredCount: expired.length,
    upcomingRenewals,
    duplicateGroups,
    dormantItems: dormant.map((s) => s.name),
    categoryBreakdown,
  };
}
