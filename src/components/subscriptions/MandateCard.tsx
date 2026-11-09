"use client";

import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import { format, parseISO, differenceInDays } from "date-fns";
import { CreditCard, Smartphone, AlertCircle } from "lucide-react";

export interface MandateItem {
  id: string;
  type: "CARD" | "UPI";
  merchant: string;
  cardLast4?: string | null;
  upiHandle?: string | null;
  upiApp?: string | null;
  frequency: string;
  mandateLimit: number;
  amount?: number | null;
  currency: string;
  nextDebitDate?: string | null;
  lastDebitDate?: string | null;
  status: string;
  createdDate?: string | null;
  subscription?: { name: string; icon?: string | null; subcategory?: string | null } | null;
}

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "Monthly",
  YEARLY: "Annual",
  QUARTERLY: "Quarterly",
  WEEKLY: "Weekly",
  DAILY: "Daily",
};

const UPI_APP_ICONS: Record<string, string> = {
  PhonePe: "💜",
  GPay: "🔵",
  Paytm: "🔷",
  BHIM: "🇮🇳",
  Cred: "⚡",
  default: "📱",
};

interface Props {
  mandate: MandateItem;
  onCancel?: (id: string) => Promise<void>;
}

export function MandateCard({ mandate, onCancel }: Props) {
  const daysUntil = mandate.nextDebitDate
    ? differenceInDays(parseISO(mandate.nextDebitDate), new Date())
    : null;
  const isUrgent = daysUntil !== null && daysUntil <= 5 && daysUntil >= 0;
  const isActive = mandate.status === "ACTIVE";

  const appIcon =
    mandate.type === "UPI"
      ? (UPI_APP_ICONS[mandate.upiApp ?? ""] ?? UPI_APP_ICONS.default)
      : "💳";

  return (
    <div className={cn(
      "glass-card p-4 flex items-start gap-3",
      !isActive && "opacity-60",
      isUrgent && "border-amber-400/30"
    )}>
      {/* Type icon */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border text-lg",
        mandate.type === "CARD"
          ? "bg-accent/10 border-accent/20"
          : "bg-income/10 border-income/20"
      )}>
        {appIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {mandate.subscription?.name ?? mandate.merchant}
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">
              {mandate.type === "CARD" ? (
                <>
                  <CreditCard className="inline w-2.5 h-2.5 mr-1" />
                  {mandate.cardLast4 ? `Card ••${mandate.cardLast4}` : "Card"} · {FREQ_LABEL[mandate.frequency]}
                </>
              ) : (
                <>
                  <Smartphone className="inline w-2.5 h-2.5 mr-1" />
                  {mandate.upiApp ?? "UPI"}{mandate.upiHandle && ` · ${mandate.upiHandle}`} · {FREQ_LABEL[mandate.frequency]}
                </>
              )}
            </p>
          </div>

          {/* Amounts + status */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-ink tabular-nums">
              {mandate.amount ? formatCurrency(mandate.amount) : (
                <span className="text-ink-muted text-xs">up to {formatCurrency(mandate.mandateLimit)}</span>
              )}
            </p>
            <div className={cn(
              "text-[9px] font-medium mt-0.5",
              mandate.status === "ACTIVE" ? "text-income" : "text-ink-muted"
            )}>
              {mandate.status}
            </div>
          </div>
        </div>

        {/* Dates row */}
        <div className="flex items-center gap-4 mt-2.5">
          {mandate.lastDebitDate && (
            <div>
              <p className="text-[9px] text-ink-faint">Last debit</p>
              <p className="text-[10px] text-ink-muted">{format(parseISO(mandate.lastDebitDate), "dd MMM yyyy")}</p>
            </div>
          )}
          {mandate.nextDebitDate && (
            <div>
              <p className="text-[9px] text-ink-faint">Next debit</p>
              <p className={cn("text-[10px]", isUrgent ? "text-amber-400 font-medium" : "text-ink-muted")}>
                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : format(parseISO(mandate.nextDebitDate), "dd MMM yyyy")}
                {isUrgent && <AlertCircle className="inline w-2.5 h-2.5 ml-1" />}
              </p>
            </div>
          )}
          {mandate.mandateLimit && (
            <div className="ml-auto text-right">
              <p className="text-[9px] text-ink-faint">Mandate limit</p>
              <p className="text-[10px] text-ink-muted">{formatCurrency(mandate.mandateLimit)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
