"use client";

import { useState, useEffect } from "react";
import { BehavioralIntelligence } from "@/components/vice/BehavioralIntelligence";
import { InsightPanel } from "@/components/insights/InsightPanel";
import type { BehavioralSummary } from "@/lib/vice/analytics";
import type { PaginatedResponse, InsightDTO } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths } from "date-fns";

export default function BehavioralPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<BehavioralSummary | null>(null);
  const [insights, setInsights] = useState<InsightDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const month = format(currentDate, "yyyy-MM");
  const isCurrentMonth = month === format(new Date(), "yyyy-MM");

  const load = async () => {
    setLoading(true);
    const [summaryRes, insightRes] = await Promise.all([
      fetch(`/api/vice/summary?month=${month}`),
      fetch("/api/insights?limit=20"),
    ]);

    const summaryJson = await summaryRes.json() as { success: boolean; data: BehavioralSummary };
    const insightJson = await insightRes.json() as { success: boolean; data: PaginatedResponse<InsightDTO> };

    if (summaryJson.success) setData(summaryJson.data);
    if (insightJson.success) {
      // Filter to behavioral/vice insights only
      setInsights(
        insightJson.data.items.filter((i) =>
          i.type === "BEHAVIORAL_PATTERN" || i.type === "SPENDING_SPIKE"
        )
      );
    }

    setLoading(false);
  };

  useEffect(() => { void load(); }, [month]);

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Behavioral Intelligence</h1>
          <p className="text-sm text-ink-muted mt-1">
            Habit-level analytics across alcohol, cigarettes, and fuel.
            No judgment — just pattern recognition.
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
            className="w-8 h-8 rounded-lg border border-glass-border bg-white/5 flex items-center
                       justify-center text-ink-muted hover:text-ink hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-ink min-w-28 text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => !isCurrentMonth && setCurrentDate((d) => subMonths(d, -1))}
            disabled={isCurrentMonth}
            className="w-8 h-8 rounded-lg border border-glass-border bg-white/5 flex items-center
                       justify-center text-ink-muted hover:text-ink hover:bg-white/10
                       disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 skeleton rounded-2xl" />
            ))}
          </div>
          <div className="h-96 skeleton rounded-2xl" />
        </div>
      ) : data ? (
        <div className="space-y-5">
          <BehavioralIntelligence data={data} />

          {insights.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink mb-3">
                Behavioral Observations
              </h2>
              <InsightPanel insights={insights} onRefresh={() => void load()} />
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-ink-muted text-sm">
            No behavioral data found for {format(currentDate, "MMMM yyyy")}. Sync Gmail to detect transactions.
          </p>
        </div>
      )}
    </div>
  );
}
