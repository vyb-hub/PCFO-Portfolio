"use client";

import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import { format, parseISO, differenceInDays } from "date-fns";
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Pause, RotateCcw } from "lucide-react";
import { useState } from "react";

export interface SubscriptionItem {
  id: string;
  name: string;
  merchant?: string | null;
  amount: number;
  currency: string;
  frequency: string;
  startDate?: string | null;
  nextDueDate?: string | null;
  lastChargedAt?: string | null;
  isActive: boolean;
  status: string;
  category: string;
  subcategory?: string | null;
  icon?: string | null;
  autoRenew: boolean;
  usageConfidence: number;
  paymentMethod?: string | null;
  cardLast4?: string | null;
  upiHandle?: string | null;
  upiApp?: string | null;
  isTrial: boolean;
  trialEndDate?: string | null;
  priceChangedFrom?: number | null;
  monthlyEquivalent: number;
  yearlyEquivalent: number;
}

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "/mo",
  YEARLY: "/yr",
  QUARTERLY: "/qtr",
  WEEKLY: "/wk",
  DAILY: "/day",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "text-income",
  DORMANT: "text-amber-400",
  TRIAL: "text-accent-light",
  PAUSED: "text-ink-muted",
  EXPIRED: "text-expense",
  CANCELLED: "text-expense",
};

const STATUS_BG: Record<string, string> = {
  ACTIVE: "bg-income/10 border-income/20",
  DORMANT: "bg-amber-400/10 border-amber-400/20",
  TRIAL: "bg-accent/10 border-accent/20",
  PAUSED: "bg-white/5 border-glass-border",
  EXPIRED: "bg-expense/10 border-expense/20",
  CANCELLED: "bg-expense/10 border-expense/20",
};

interface Props {
  sub: SubscriptionItem;
  onStatusChange?: (id: string, status: string, isActive: boolean) => Promise<void>;
}

export function SubscriptionCard({ sub, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const daysUntilRenewal = sub.nextDueDate
    ? differenceInDays(parseISO(sub.nextDueDate), new Date())
    : null;

  const isUrgent = daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal >= 0;
  const isDormant = sub.status === "DORMANT" || sub.usageConfidence < 0.3;
  const hasPriceHike = sub.priceChangedFrom != null && sub.priceChangedFrom < sub.amount;

  const handlePause = async () => {
    if (!onStatusChange) return;
    setUpdating(true);
    await onStatusChange(sub.id, "PAUSED", false);
    setUpdating(false);
  };

  const handleReactivate = async () => {
    if (!onStatusChange) return;
    setUpdating(true);
    await onStatusChange(sub.id, "ACTIVE", true);
    setUpdating(false);
  };

  return (
    <div className={cn(
      "glass-card overflow-hidden transition-all",
      isDormant && "border-amber-400/20",
      isUrgent && "border-income/30",
    )}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border",
          STATUS_BG[sub.status] ?? "bg-white/5 border-glass-border"
        )}>
          {sub.icon ?? (sub.subcategory === "Streaming" ? "📺"
            : sub.subcategory === "Music" ? "🎵"
            : sub.subcategory === "AI Tools" ? "🤖"
            : sub.subcategory === "Fitness" ? "💪"
            : "🔄")}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-ink">{sub.name}</span>
            {sub.isTrial && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent-light">
                Trial
              </span>
            )}
            {hasPriceHike && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" />
                Price ↑
              </span>
            )}
            {isDormant && sub.status !== "PAUSED" && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
                Dormant
              </span>
            )}
          </div>
          <p className="text-[10px] text-ink-muted mt-0.5">
            {sub.subcategory ?? sub.category}
            {sub.paymentMethod && ` · ${sub.paymentMethod}${sub.cardLast4 ? ` ••${sub.cardLast4}` : ""}`}
            {sub.upiApp && ` · ${sub.upiApp}`}
          </p>
        </div>

        {/* Amount + renewal */}
        <div className="text-right flex-shrink-0 mr-2">
          <p className="text-sm font-semibold text-ink tabular-nums">
            {formatCurrency(sub.amount)}
            <span className="text-[10px] text-ink-muted font-normal">
              {FREQ_LABEL[sub.frequency] ?? ""}
            </span>
          </p>
          {daysUntilRenewal !== null && daysUntilRenewal >= 0 && (
            <p className={cn("text-[10px] mt-0.5", isUrgent ? "text-amber-400 font-medium" : "text-ink-muted")}>
              {daysUntilRenewal === 0 ? "Due today" : `in ${daysUntilRenewal}d`}
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className={cn(
          "text-[9px] font-semibold px-2 py-1 rounded-full border flex-shrink-0",
          STATUS_BG[sub.status] ?? "bg-white/5 border-glass-border",
          STATUS_COLOR[sub.status] ?? "text-ink-muted"
        )}>
          {sub.status}
        </div>

        <div className="text-ink-faint flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-glass-border px-4 py-4 bg-white/[0.02] space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              ["Started", sub.startDate ? format(parseISO(sub.startDate), "dd MMM yyyy") : "—"],
              ["Last charged", sub.lastChargedAt ? format(parseISO(sub.lastChargedAt), "dd MMM yyyy") : "—"],
              ["Next renewal", sub.nextDueDate ? format(parseISO(sub.nextDueDate), "dd MMM yyyy") : "—"],
              ["Auto-renew", sub.autoRenew ? "Yes" : "No"],
              ["Monthly cost", formatCurrency(sub.monthlyEquivalent)],
              ["Annual cost", formatCurrency(sub.yearlyEquivalent)],
              ...(sub.upiHandle ? [["UPI handle", sub.upiHandle]] : []),
              ...(sub.priceChangedFrom ? [["Original price", formatCurrency(sub.priceChangedFrom) + FREQ_LABEL[sub.frequency]]] : []),
              ...(sub.trialEndDate ? [["Trial ends", format(parseISO(sub.trialEndDate), "dd MMM yyyy")]] : []),
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] text-ink-faint uppercase tracking-wider">{k}</p>
                <p className="text-xs text-ink mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* Usage confidence bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-ink-faint">Usage confidence</span>
              <span className="text-[9px] text-ink-muted">{(sub.usageConfidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", sub.usageConfidence >= 0.6 ? "bg-income" : sub.usageConfidence >= 0.3 ? "bg-amber-400" : "bg-expense")}
                style={{ width: `${sub.usageConfidence * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {sub.isActive && sub.status !== "PAUSED" ? (
              <button
                onClick={handlePause}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                           border border-amber-400/30 bg-amber-400/10 text-amber-400
                           hover:bg-amber-400/20 transition-all disabled:opacity-40"
              >
                <Pause className="w-3 h-3" />
                Pause
              </button>
            ) : sub.status === "PAUSED" ? (
              <button
                onClick={handleReactivate}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                           border border-income/30 bg-income/10 text-income
                           hover:bg-income/20 transition-all disabled:opacity-40"
              >
                <RotateCcw className="w-3 h-3" />
                Reactivate
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
