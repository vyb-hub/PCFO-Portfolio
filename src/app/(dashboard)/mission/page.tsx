"use client";

import { useEffect, useState, useCallback } from "react";
import { MissionControl } from "@/components/mission/MissionControl";
import { StrategyPanel } from "@/components/mission/StrategyPanel";
import type { MissionState } from "@/lib/mission/calculator";
import type { Strategy } from "@/lib/mission/strategy";
import { DebtManager } from "@/components/mission/DebtManager";
import { Crosshair, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "strategies" | "debts";

export default function MissionPage() {
  const [state, setState] = useState<MissionState | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingState, setLoadingState] = useState(true);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const fetchState = useCallback(async () => {
    setLoadingState(true);
    try {
      const res = await fetch("/api/mission/summary");
      const json = await res.json() as { success: boolean; data: MissionState };
      if (json.success) setState(json.data);
    } finally {
      setLoadingState(false);
    }
  }, []);

  const fetchStrategies = useCallback(async () => {
    setLoadingStrategies(true);
    try {
      const res = await fetch("/api/mission/strategy");
      const json = await res.json() as { success: boolean; data: Strategy[] };
      if (json.success) setStrategies(json.data);
    } finally {
      setLoadingStrategies(false);
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (tab === "strategies" && strategies.length === 0) {
      void fetchStrategies();
    }
  }, [tab, strategies.length, fetchStrategies]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchState();
    if (tab === "strategies") await fetchStrategies();
    setRefreshing(false);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "strategies", label: "Strategies" },
    { id: "debts", label: "Debts" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-income/10 border border-income/20 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-income" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Mission Control</h1>
            <p className="text-xs text-ink-muted">Debt freedom · ₹5,00,000 reserve</p>
          </div>
        </div>
        <button
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                     text-ink-muted hover:text-ink border border-glass-border
                     hover:bg-white/5 transition-all disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-glass-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
              tab === t.id
                ? "bg-white/10 text-ink"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        loadingState ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-40 skeleton" />
            ))}
          </div>
        ) : state ? (
          <MissionControl state={state} />
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-xs text-ink-muted">Unable to load mission data.</p>
          </div>
        )
      )}

      {tab === "strategies" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-ink-muted">
              AI-generated strategies based on your financial patterns
            </p>
          </div>
          <StrategyPanel strategies={strategies} loading={loadingStrategies} />
        </div>
      )}

      {tab === "debts" && (
        <DebtManager onUpdate={() => void fetchState()} />
      )}
    </div>
  );
}
