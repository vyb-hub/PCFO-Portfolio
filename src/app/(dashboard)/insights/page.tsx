"use client";

import { useState, useEffect } from "react";
import { InsightPanel } from "@/components/insights/InsightPanel";
import type { InsightDTO, PaginatedResponse } from "@/types";

export default function InsightsPage() {
  const [data, setData] = useState<PaginatedResponse<InsightDTO> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/insights?limit=50");
    const json = await res.json() as { success: boolean; data: PaginatedResponse<InsightDTO> };
    if (json.success) setData(json.data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">AI Insights</h1>
        <p className="text-sm text-ink-muted mt-1">
          Behavioral observations and financial intelligence, generated from your spending patterns.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <InsightPanel
          insights={data?.items ?? []}
          onRefresh={() => void load()}
        />
      )}
    </div>
  );
}
