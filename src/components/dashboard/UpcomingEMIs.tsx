"use client";

import { format, parseISO, differenceInDays } from "date-fns";
import { AlertCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { SubscriptionDTO } from "@/types";

interface Props {
  items: SubscriptionDTO[];
}

export function UpcomingEMIs({ items }: Props) {
  return (
    <div className="glass-card p-5 h-full">
      <h2 className="text-sm font-semibold text-ink mb-4">Upcoming EMIs & Bills</h2>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
          No upcoming bills detected.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const daysLeft = item.nextDueDate
              ? differenceInDays(parseISO(item.nextDueDate), new Date())
              : null;
            const isUrgent = daysLeft !== null && daysLeft <= 3;
            const isWarning = daysLeft !== null && daysLeft <= 7;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  isUrgent
                    ? "bg-expense-muted border-expense-border"
                    : isWarning
                    ? "bg-warning-muted border-warning/20"
                    : "bg-white/3 border-glass-border"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  isUrgent ? "bg-expense/20" : "bg-white/5"
                )}>
                  {isUrgent
                    ? <AlertCircle className="w-4 h-4 text-expense" />
                    : <Clock className="w-4 h-4 text-ink-muted" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{item.name}</p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isUrgent ? "text-expense" : "text-ink-muted"
                  )}>
                    {daysLeft === null
                      ? "Due date unknown"
                      : daysLeft === 0
                      ? "Due today"
                      : daysLeft < 0
                      ? `${Math.abs(daysLeft)}d overdue`
                      : `Due in ${daysLeft}d`}
                    {item.nextDueDate && ` · ${format(parseISO(item.nextDueDate), "dd MMM")}`}
                  </p>
                </div>

                <p className="text-sm font-semibold text-ink tabular-nums flex-shrink-0">
                  {formatCurrency(item.amount, item.currency)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
