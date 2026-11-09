"use client";

import { TrendingUp, TrendingDown, Minus, Flame, PiggyBank, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { MonthlySummary } from "@/types";

interface Props {
  summary: MonthlySummary;
}

export function MetricsBar({ summary }: Props) {
  const metrics = [
    {
      label: "Monthly Income",
      value: formatCurrency(summary.totalIncome),
      icon: ArrowUpRight,
      iconColor: "text-income",
      iconBg: "bg-income-muted",
      trend: null,
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(summary.totalExpenses),
      icon: ArrowDownRight,
      iconColor: "text-expense",
      iconBg: "bg-expense-muted",
      trend: null,
      trendInverted: true,
    },
    {
      label: "Net Savings",
      value: formatCurrency(Math.max(0, summary.totalIncome - summary.totalExpenses)),
      icon: PiggyBank,
      iconColor: "text-accent-light",
      iconBg: "bg-accent-muted",
      trend: summary.savingsRate > 0 ? summary.savingsRate * 100 : null,
      trendLabel: summary.savingsRate > 0
        ? `${(summary.savingsRate * 100).toFixed(0)}% rate`
        : "No savings",
    },
    {
      label: "Daily Burn Rate",
      value: `${formatCurrency(summary.burnRate)}/day`,
      icon: Flame,
      iconColor: "text-warning",
      iconBg: "bg-warning-muted",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="metric-card">
          <div className="flex items-start justify-between">
            <p className="text-xs text-ink-muted font-medium">{m.label}</p>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", m.iconBg)}>
              <m.icon className={cn("w-4 h-4", m.iconColor)} />
            </div>
          </div>
          <p className="text-xl font-semibold text-ink tabular-nums">{m.value}</p>
          {m.trendLabel ? (
            <p className="text-xs text-ink-muted">{m.trendLabel}</p>
          ) : m.trend !== null ? (
            <TrendBadge value={m.trend} inverted={m.trendInverted} />
          ) : (
            <p className="text-xs text-ink-faint">This month</p>
          )}
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ value, inverted }: { value: number; inverted?: boolean }) {
  const isPositive = value > 0;
  const isGood = inverted ? !isPositive : isPositive;

  if (Math.abs(value) < 0.5) {
    return (
      <div className="flex items-center gap-1 text-xs text-ink-muted">
        <Minus className="w-3 h-3" />
        <span>No change</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium",
      isGood ? "text-income" : "text-expense"
    )}>
      {isPositive
        ? <TrendingUp className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />
      }
      <span>{Math.abs(value).toFixed(1)}% vs last month</span>
    </div>
  );
}
