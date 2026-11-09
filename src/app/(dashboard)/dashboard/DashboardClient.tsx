"use client";

import { useState, useEffect } from "react";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryPie } from "@/components/dashboard/CategoryPie";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { UpcomingEMIs } from "@/components/dashboard/UpcomingEMIs";
import { MissionWidget } from "@/components/dashboard/MissionWidget";
import { FinancialReviewCard } from "@/components/dashboard/FinancialReviewCard";
import { LargestExpenseStoryCard } from "@/components/dashboard/LargestExpenseStoryCard";
import { FinancialClosingCard } from "@/components/dashboard/FinancialClosingCard";
import type { DashboardData } from "@/types";
import { RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/summary");
      const json = await res.json() as { success: boolean; data: DashboardData; error?: string };
      if (json.success) setData(json.data);
      else setError(json.error ?? "Failed to load data");
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-expense mb-2">{error}</p>
          <button onClick={() => void load()} className="text-sm text-accent-light hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-ink-muted text-sm">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(), "MMMM yyyy")}
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                     border border-glass-border text-ink-muted hover:text-ink text-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Metrics row */}
      <MetricsBar summary={data.summary} />

      {/* Financial Intelligence Review */}
      <div className="mt-5">
        <FinancialReviewCard />
      </div>

      {/* Financial Story Engine — Largest Expense */}
      <div className="mt-5">
        <LargestExpenseStoryCard />
      </div>

      {/* Financial Closing — monthly lifecycle status */}
      <div className="mt-5">
        <FinancialClosingCard />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
        {/* Spending chart — spans 2 cols */}
        <div className="xl:col-span-2">
          <SpendingChart trend={data.spendingTrend} />
        </div>

        {/* Category pie */}
        <CategoryPie breakdown={data.categoryBreakdown} total={data.summary.totalExpenses} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
        {/* Recent transactions — spans 2 cols */}
        <div className="xl:col-span-2">
          <RecentTransactions transactions={data.recentTransactions} />
        </div>

        {/* Right column: EMIs + Mission */}
        <div className="space-y-5">
          <UpcomingEMIs items={data.upcomingEMIs} />
          <MissionWidget />
        </div>
      </div>

      {/* AI Insight Panel */}
      <div className="mt-5">
        <InsightPanel insights={data.topInsights} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-6 py-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-40 skeleton rounded-lg mb-7" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 h-64 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  );
}
