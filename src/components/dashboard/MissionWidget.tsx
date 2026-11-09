"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crosshair, ChevronRight, TrendingUp } from "lucide-react";
import { ProgressRing } from "@/components/mission/ProgressRing";
import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { MissionState } from "@/lib/mission/calculator";

interface Response {
  success: boolean;
  data: MissionState;
}

function scoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 45) return "#f59e0b";
  return "#ef4444";
}

export function MissionWidget() {
  const [state, setState] = useState<MissionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mission/summary")
      .then((r) => r.json())
      .then((j: Response) => { if (j.success) setState(j.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 skeleton rounded-2xl" />;
  if (!state) return null;

  const healthColor = scoreColor(state.healthScore);
  const savingsPct = Math.round(state.savingsProgress * 100);
  const debtPct = Math.round(state.debtProgress * 100);

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-accent-light" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">Mission Control</p>
            <p className="text-[10px] text-ink-muted">Debt Freedom · ₹5L Reserve</p>
          </div>
        </div>
        <Link
          href="/mission"
          className="flex items-center gap-0.5 text-[10px] text-accent-light hover:underline"
        >
          View <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Progress rings */}
      <div className="flex items-center justify-around mb-4">
        <div className="flex flex-col items-center gap-1">
          <ProgressRing
            progress={state.savingsProgress}
            size={80}
            strokeWidth={7}
            color="#10b981"
            label={`${savingsPct}%`}
            sublabel="Savings"
            glow={savingsPct >= 50}
          />
        </div>

        {/* Health score center */}
        <div className="text-center">
          <div
            className="text-3xl font-bold tabular-nums"
            style={{ color: healthColor }}
          >
            {state.healthScore}
          </div>
          <p className="text-[9px] text-ink-faint uppercase tracking-wider mt-0.5">Health</p>
          <div className="mt-2 w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${state.healthScore}%`, backgroundColor: healthColor }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <ProgressRing
            progress={state.debtProgress}
            size={80}
            strokeWidth={7}
            color="#6366f1"
            label={`${debtPct}%`}
            sublabel="Debt free"
            glow={debtPct >= 50}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-glass-border">
        {[
          {
            label: "Net cash flow",
            value: formatCurrency(state.netCashFlow),
            positive: state.netCashFlow >= 0,
          },
          {
            label: "Debt remaining",
            value: formatCurrency(state.totalDebt),
            positive: false,
            neutral: true,
          },
          {
            label: "Savings rate",
            value: formatCurrency(state.monthlySavingsRate),
            positive: state.monthlySavingsRate > 0,
          },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[9px] text-ink-faint uppercase tracking-wider">{s.label}</p>
            <p className={cn(
              "text-xs font-semibold tabular-nums mt-0.5",
              s.neutral ? "text-ink" : s.positive ? "text-income" : "text-expense"
            )}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Projection nudge */}
      {state.monthsToDebtFree !== null && state.monthsToDebtFree <= 12 && (
        <div className="mt-3 flex items-center gap-1.5 p-2 rounded-lg bg-income/5 border border-income/15">
          <TrendingUp className="w-3 h-3 text-income flex-shrink-0" />
          <p className="text-[10px] text-income">
            Debt-free in ~{state.monthsToDebtFree}mo at current pace
          </p>
        </div>
      )}
    </div>
  );
}
