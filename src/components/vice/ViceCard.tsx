"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/categories";
import type { ViceSummary } from "@/lib/vice/analytics";

interface ViceCardConfig {
  label: string;
  icon: string;
  accentColor: string;
  accentMuted: string;
  accentBorder: string;
  burnLabel: string;
  observation: (s: ViceSummary) => string;
}

const CONFIG: Record<string, ViceCardConfig> = {
  ALCOHOL: {
    label: "Booze Burn",
    icon: "🍺",
    accentColor: "#f59e0b",
    accentMuted: "rgba(245,158,11,0.1)",
    accentBorder: "rgba(245,158,11,0.25)",
    burnLabel: "Booze Burn Rate",
    observation: (s) => {
      if (s.weekendDamageIndex > 2.5)
        return `Weekend damage index: ${s.weekendDamageIndex.toFixed(1)}×. The council convenes.`;
      if (s.postSalaryTotal > s.currentMonth * 0.35)
        return `${((s.postSalaryTotal / s.currentMonth) * 100).toFixed(0)}% spent within 3 days of salary. Ancient rituals.`;
      return `${s.transactionCount} KSBC visits this month.`;
    },
  },
  CIGARETTES: {
    label: "Smoke Spend",
    icon: "🚬",
    accentColor: "#9ca3af",
    accentMuted: "rgba(156,163,175,0.1)",
    accentBorder: "rgba(156,163,175,0.2)",
    burnLabel: "Daily Smoke Cost",
    observation: (s) => {
      if (s.lateNightTotal > s.currentMonth * 0.5)
        return `${((s.lateNightTotal / s.currentMonth) * 100).toFixed(0)}% of orders after 10 PM. Nicotine operates in night mode.`;
      if (s.transactionCount > 0)
        return `${s.transactionCount} delivery orders this month.`;
      return "No orders detected this month.";
    },
  },
  FUEL: {
    label: "Fuel Drain",
    icon: "⛽",
    accentColor: "#06b6d4",
    accentMuted: "rgba(6,182,212,0.1)",
    accentBorder: "rgba(6,182,212,0.22)",
    burnLabel: "Daily Fuel Cost",
    observation: (s) => {
      if (s.changePercent > 25)
        return `Up ${s.changePercent.toFixed(0)}% vs last month. Either traffic worsened or the long drives are back.`;
      if (s.changePercent < -15)
        return `Down ${Math.abs(s.changePercent).toFixed(0)}% vs last month. The car is resting.`;
      return `${formatCurrency(s.avgPerTransaction)} avg refill. Consistent.`;
    },
  },
};

interface Props {
  summary: ViceSummary;
  className?: string;
}

export function ViceCard({ summary, className }: Props) {
  const cfg = CONFIG[summary.type]!;
  const isUp = summary.changePercent > 0;
  const isFlat = Math.abs(summary.changePercent) < 1;

  return (
    <div
      className={cn("rounded-2xl p-5 flex flex-col gap-3 border", className)}
      style={{
        background: `linear-gradient(135deg, ${cfg.accentMuted} 0%, rgba(10,10,26,0.6) 100%)`,
        borderColor: cfg.accentBorder,
        boxShadow: `0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.accentBorder}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: cfg.accentColor }}>
            {cfg.label}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-lg">{cfg.icon}</span>
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: cfg.accentMuted, border: `1px solid ${cfg.accentBorder}` }}
        >
          {cfg.icon}
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-2xl font-semibold text-ink tabular-nums tracking-tight">
          {formatCurrency(summary.currentMonth)}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {isFlat ? (
            <div className="flex items-center gap-1 text-xs text-ink-muted">
              <Minus className="w-3 h-3" />
              No change
            </div>
          ) : (
            <div className={cn("flex items-center gap-1 text-xs font-medium",
              isUp ? "text-expense" : "text-income"
            )}>
              {isUp
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {Math.abs(summary.changePercent).toFixed(1)}% vs last month
            </div>
          )}
        </div>
      </div>

      {/* Micro stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2.5" style={{ background: "rgba(0,0,0,0.2)" }}>
          <p className="text-[10px]" style={{ color: cfg.accentColor }}>{cfg.burnLabel}</p>
          <p className="text-sm font-semibold text-ink tabular-nums mt-0.5">
            {formatCurrency(summary.burnRate)}/day
          </p>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "rgba(0,0,0,0.2)" }}>
          <p className="text-[10px]" style={{ color: cfg.accentColor }}>Weekend ratio</p>
          <p className="text-sm font-semibold text-ink tabular-nums mt-0.5">
            {(summary.weekendRatio * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* AI observation */}
      <p className="text-[11px] text-ink-muted leading-relaxed border-t pt-2.5"
         style={{ borderColor: cfg.accentBorder }}>
        {cfg.observation(summary)}
      </p>
    </div>
  );
}
