"use client";

import { cn } from "@/lib/utils/cn";
import type { Strategy } from "@/lib/mission/strategy";
import { TrendingUp, PiggyBank, Brain, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const CATEGORY_META: Record<
  Strategy["category"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  debt: { icon: TrendingUp, color: "text-expense", bg: "bg-expense/10" },
  savings: { icon: PiggyBank, color: "text-income", bg: "bg-income/10" },
  behavior: { icon: Brain, color: "text-amber-400", bg: "bg-amber-400/10" },
  cashflow: { icon: DollarSign, color: "text-accent-light", bg: "bg-accent/10" },
};

const PRIORITY_LABEL: Record<Strategy["priority"], string> = {
  high: "High impact",
  medium: "Medium",
  low: "Maintenance",
};

const PRIORITY_COLOR: Record<Strategy["priority"], string> = {
  high: "text-expense",
  medium: "text-amber-400",
  low: "text-ink-muted",
};

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[strategy.category];
  const Icon = meta.icon;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", meta.bg)}>
          <Icon className={cn("w-4 h-4", meta.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-ink truncate">
              {strategy.title}
            </span>
            <span className={cn("text-[9px] font-medium ml-auto flex-shrink-0", PRIORITY_COLOR[strategy.priority])}>
              {PRIORITY_LABEL[strategy.priority]}
            </span>
          </div>
          <p className="text-[11px] text-income font-medium">{strategy.impact}</p>
        </div>

        <div className="flex-shrink-0 ml-2">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-ink-faint" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-ink-faint" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="pl-11">
            <p className="text-[11px] text-ink-muted leading-relaxed">{strategy.body}</p>
            {strategy.impactDays && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-income/10 border border-income/20">
                <span className="text-[10px] text-income font-medium">
                  +{strategy.impactDays} days closer to goal
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  strategies: Strategy[];
  loading?: boolean;
}

export function StrategyPanel({ strategies, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-16 skeleton" />
        ))}
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-xs text-ink-muted">
          Add your income, debts, and goal to unlock strategy generation.
        </p>
      </div>
    );
  }

  const high = strategies.filter((s) => s.priority === "high");
  const rest = strategies.filter((s) => s.priority !== "high");

  return (
    <div className="space-y-3">
      {high.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-ink-faint uppercase tracking-wider px-1">Priority actions</p>
          {high.map((s) => <StrategyCard key={s.id} strategy={s} />)}
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-2">
          {high.length > 0 && (
            <p className="text-[10px] text-ink-faint uppercase tracking-wider px-1">Other strategies</p>
          )}
          {rest.map((s) => <StrategyCard key={s.id} strategy={s} />)}
        </div>
      )}
    </div>
  );
}
