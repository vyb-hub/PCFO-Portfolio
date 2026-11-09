"use client";

import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { SubscriptionHealth } from "@/lib/subscriptions/analytics";
import { Activity, AlertTriangle, TrendingDown } from "lucide-react";

interface Props {
  health: SubscriptionHealth;
}

function ScoreMeter({
  label,
  score,
  invert = false,
  color,
}: {
  label: string;
  score: number;
  invert?: boolean;
  color: string;
}) {
  const displayScore = invert ? 100 - score : score;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-[10px] text-ink-muted">{label}</span>
        <span className="text-[10px] font-medium tabular-nums" style={{ color }}>
          {displayScore}/100
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${displayScore}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function SubscriptionHealthScore({ health }: Props) {
  const healthColor =
    health.healthScore >= 75 ? "#10b981"
    : health.healthScore >= 50 ? "#f59e0b"
    : "#f43f5e";

  const complexityColor =
    health.complexityRating === "Low" ? "#10b981"
    : health.complexityRating === "Medium" ? "#f59e0b"
    : "#f43f5e";

  return (
    <div className="glass-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-ink">Subscription Health</h3>
            <p className="text-[10px] text-ink-muted mt-0.5">
              {health.activeCount} active · {health.dormantCount} dormant
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-semibold tabular-nums"
            style={{ color: healthColor }}
          >
            {health.healthScore}
          </p>
          <p className="text-[9px] text-ink-faint">/100</p>
        </div>
      </div>

      {/* Score meters */}
      <div className="space-y-3">
        <ScoreMeter label="Health score" score={health.healthScore} color={healthColor} />
        <ScoreMeter label="Waste score" score={health.wasteScore} invert color="#f43f5e" />
        <ScoreMeter label="Dormancy risk" score={health.dormancyScore} invert color="#f59e0b" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="glass-card p-3 text-center">
          <p className="text-[9px] text-ink-faint uppercase tracking-wider">Monthly</p>
          <p className="text-sm font-semibold text-ink tabular-nums mt-1">
            {formatCurrency(health.monthlyBurden)}
          </p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-[9px] text-ink-faint uppercase tracking-wider">Annual</p>
          <p className="text-sm font-semibold text-ink tabular-nums mt-1">
            {formatCurrency(health.yearlyBurden)}
          </p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-[9px] text-ink-faint uppercase tracking-wider">Complexity</p>
          <p className="text-xs font-semibold mt-1" style={{ color: complexityColor }}>
            {health.complexityRating}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {health.categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] text-ink-faint uppercase tracking-wider">By category</p>
          {health.categoryBreakdown.slice(0, 5).map((cat) => (
            <div key={cat.category} className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted w-28 truncate">{cat.category}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/60"
                  style={{
                    width: `${Math.min(100, (cat.monthlyTotal / health.monthlyBurden) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-ink-muted tabular-nums w-14 text-right">
                {formatCurrency(cat.monthlyTotal)}/mo
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Duplicate alerts */}
      {health.duplicateGroups.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-glass-border">
          <p className="text-[9px] text-ink-faint uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            Overlapping subscriptions
          </p>
          {health.duplicateGroups.map((grp) => (
            <div key={grp.subcategory} className="p-2.5 rounded-xl bg-amber-400/5 border border-amber-400/15">
              <p className="text-[10px] text-amber-400 font-medium">{grp.subcategory}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">
                {grp.items.map((i) => i.name).join(" · ")}
                {" · "}
                <span className="text-amber-400">{formatCurrency(grp.totalMonthly)}/mo combined</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
