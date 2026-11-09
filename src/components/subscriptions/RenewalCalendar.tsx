"use client";

import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { UpcomingRenewal } from "@/lib/subscriptions/analytics";
import { format } from "date-fns";
import { Calendar, AlertCircle } from "lucide-react";

interface Props {
  renewals: UpcomingRenewal[];
}

const FREQ_SHORT: Record<string, string> = {
  MONTHLY: "/mo",
  YEARLY: "/yr",
  QUARTERLY: "/qtr",
  WEEKLY: "/wk",
  DAILY: "/day",
};

export function RenewalCalendar({ renewals }: Props) {
  if (renewals.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Calendar className="w-8 h-8 text-ink-faint mx-auto mb-2" />
        <p className="text-xs text-ink-muted">No renewals in the next 30 days.</p>
      </div>
    );
  }

  const urgent = renewals.filter((r) => r.isUrgent);
  const rest = renewals.filter((r) => !r.isUrgent);
  const totalUpcoming = renewals.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-3">
      {urgent.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            {urgent.length} renewal{urgent.length > 1 ? "s" : ""} due within 7 days
            {" · "}
            <span className="font-semibold">{formatCurrency(urgent.reduce((s, r) => s + r.amount, 0))}</span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {renewals.map((r) => (
          <div
            key={r.id}
            className={cn(
              "glass-card flex items-center gap-3 p-3",
              r.isUrgent && "border-amber-400/25"
            )}
          >
            {/* Day countdown pill */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border",
              r.isUrgent
                ? "bg-amber-400/10 border-amber-400/25"
                : "bg-white/5 border-glass-border"
            )}>
              <span className={cn(
                "text-base font-bold tabular-nums leading-none",
                r.isUrgent ? "text-amber-400" : "text-ink"
              )}>
                {r.daysUntil === 0 ? "!" : r.daysUntil}
              </span>
              <span className="text-[8px] text-ink-faint mt-0.5">
                {r.daysUntil === 0 ? "today" : "days"}
              </span>
            </div>

            {/* Service name + date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {r.icon && <span className="text-sm">{r.icon}</span>}
                <p className="text-sm font-medium text-ink">{r.name}</p>
              </div>
              <p className="text-[10px] text-ink-muted mt-0.5">
                {format(r.nextDueDate, "EEEE, dd MMM yyyy")}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-ink tabular-nums">
                {formatCurrency(r.amount)}
              </p>
              <p className="text-[10px] text-ink-muted">
                {FREQ_SHORT[r.frequency] ?? ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-[10px] text-ink-faint">Total due in 30 days</span>
        <span className="text-xs font-semibold text-ink tabular-nums">
          {formatCurrency(totalUpcoming)}
        </span>
      </div>
    </div>
  );
}
