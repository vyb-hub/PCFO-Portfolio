"use client";

import { useState } from "react";
import { ViceCard } from "./ViceCard";
import { HabitHeatmap } from "./HabitHeatmap";
import { ViceTrendChart } from "./ViceTrendChart";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/categories";
import type { BehavioralSummary } from "@/lib/vice/analytics";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  data: BehavioralSummary;
}

const VICE_CONFIG = [
  {
    key: "alcohol" as const,
    label: "Alcohol",
    icon: "🍺",
    accentColor: "#f59e0b",
  },
  {
    key: "cigarettes" as const,
    label: "Cigarettes",
    icon: "🚬",
    accentColor: "#9ca3af",
  },
  {
    key: "fuel" as const,
    label: "Fuel",
    icon: "⛽",
    accentColor: "#06b6d4",
  },
];

export function BehavioralIntelligence({ data }: Props) {
  const [expanded, setExpanded] = useState<string | null>("alcohol");

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25
                          flex items-center justify-center">
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Behavioral Spend Intelligence</h2>
            <p className="text-[11px] text-ink-muted">
              Pattern recognition across habit categories
            </p>
          </div>
        </div>

        {/* Total vice spend badge */}
        <div className="text-right">
          <p className="text-[10px] text-ink-muted">Combined this month</p>
          <p className="text-base font-semibold text-ink tabular-nums">
            {formatCurrency(data.totalViceSpend)}
          </p>
          <p className="text-[10px] text-ink-muted">
            {data.viceAsPercentOfExpenses.toFixed(1)}% of total expenses
          </p>
        </div>
      </div>

      {/* Pattern observation */}
      {data.dominantPattern && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/15 bg-amber-500/5
                        flex items-start gap-2.5">
          <span className="text-sm mt-0.5">📡</span>
          <p className="text-xs text-ink-muted leading-relaxed">{data.dominantPattern}</p>
        </div>
      )}

      {/* Metric cards row */}
      <div className="grid grid-cols-3 gap-3">
        <ViceCard summary={data.alcohol} />
        <ViceCard summary={data.cigarettes} />
        <ViceCard summary={data.fuel} />
      </div>

      {/* Detailed breakdown tabs */}
      <div className="rounded-2xl border border-glass-border bg-surface/50 overflow-hidden">
        {VICE_CONFIG.map((cfg) => {
          const summary = data[cfg.key];
          const isOpen = expanded === cfg.key;

          return (
            <div key={cfg.key}>
              <button
                onClick={() => setExpanded(isOpen ? null : cfg.key)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3
                           transition-colors border-b border-glass-border last:border-0 text-left"
              >
                <span className="text-lg">{cfg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{cfg.label}</span>
                    {summary.currentMonth > 0 && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          background: `rgba(${hexToRgb(cfg.accentColor)}, 0.12)`,
                          color: cfg.accentColor,
                          border: `1px solid rgba(${hexToRgb(cfg.accentColor)}, 0.2)`,
                        }}
                      >
                        {formatCurrency(summary.currentMonth)}
                      </span>
                    )}
                    {summary.changePercent !== 0 && (
                      <span className={cn(
                        "text-[10px]",
                        summary.changePercent > 0 ? "text-expense" : "text-income"
                      )}>
                        {summary.changePercent > 0 ? "↑" : "↓"}
                        {Math.abs(summary.changePercent).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {summary.transactionCount} transactions · ₹{summary.burnRate.toFixed(0)}/day avg
                  </p>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-ink-muted flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-ink-muted flex-shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-5 py-5 border-b border-glass-border last:border-0
                                bg-black/15 space-y-6">
                  {/* Trend chart */}
                  <div>
                    <p className="text-xs font-medium text-ink-muted mb-3">
                      Daily spend — this month
                    </p>
                    <ViceTrendChart
                      dailyTotals={summary.dailyTotals}
                      accentColor={cfg.accentColor}
                      label={cfg.label}
                    />
                  </div>

                  {/* Heatmap */}
                  <div>
                    <p className="text-xs font-medium text-ink-muted mb-3">
                      Behavioral patterns
                    </p>
                    <HabitHeatmap summary={summary} accentColor={cfg.accentColor} />
                  </div>

                  {/* Vice-specific stats */}
                  <ViceDetailStats summary={summary} accentColor={cfg.accentColor} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Salary correlation */}
      {data.salaryToViceCorrelation !== "low" && (
        <div className={cn(
          "px-4 py-3 rounded-xl border flex items-start gap-2.5",
          data.salaryToViceCorrelation === "high"
            ? "bg-expense-muted border-expense-border"
            : "bg-warning-muted border-warning/20"
        )}>
          <span className="text-sm mt-0.5">💸</span>
          <div>
            <p className="text-xs font-semibold text-ink">
              {data.salaryToViceCorrelation === "high" ? "High" : "Medium"} salary-to-vice correlation
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              A meaningful portion of vice spending clusters within 3 days of salary credit.
              The pattern is consistent. The pattern is noted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ViceDetailStats({
  summary,
  accentColor,
}: {
  summary: BehavioralSummary["alcohol"];
  accentColor: string;
}) {
  const stats = [
    { label: "Avg per visit", value: formatCurrency(summary.avgPerTransaction) },
    { label: "Weekend damage index", value: `${summary.weekendDamageIndex.toFixed(1)}×` },
    { label: "Previous month", value: formatCurrency(summary.previousMonth) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl p-3 text-center"
          style={{
            background: "rgba(0,0,0,0.2)",
            border: `1px solid rgba(${hexToRgb(accentColor)}, 0.1)`,
          }}
        >
          <p className="text-[10px] text-ink-muted">{s.label}</p>
          <p className="text-sm font-semibold text-ink tabular-nums mt-0.5">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  return [0, 2, 4]
    .map((i) => parseInt(clean.substring(i, i + 2), 16))
    .join(",");
}
