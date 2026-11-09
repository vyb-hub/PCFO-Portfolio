"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import { SubscriptionCard, type SubscriptionItem } from "@/components/subscriptions/SubscriptionCard";
import { MandateCard, type MandateItem } from "@/components/subscriptions/MandateCard";
import { SubscriptionHealthScore } from "@/components/subscriptions/HealthScore";
import { RenewalCalendar } from "@/components/subscriptions/RenewalCalendar";
import { SubscriptionInsightPanel } from "@/components/subscriptions/InsightPanel";
import type { SubscriptionHealth } from "@/lib/subscriptions/analytics";
import {
  Repeat2, CreditCard, Smartphone, Calendar,
  Sparkles, Plus, RefreshCw, AlertTriangle,
} from "lucide-react";

type Tab = "active" | "expired" | "upcoming" | "mandates" | "upi" | "insights";

interface SubsResponse {
  success: boolean;
  data: { items: SubscriptionItem[]; health: SubscriptionHealth | null };
}
interface MandatesResponse {
  success: boolean;
  data: { cardMandates: MandateItem[]; upiMandates: MandateItem[]; total: number };
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "active", label: "Active", icon: Repeat2 },
  { id: "expired", label: "Expired", icon: AlertTriangle },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "mandates", label: "Card Mandates", icon: CreditCard },
  { id: "upi", label: "UPI Autopay", icon: Smartphone },
  { id: "insights", label: "AI Insights", icon: Sparkles },
];

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [health, setHealth] = useState<SubscriptionHealth | null>(null);
  const [cardMandates, setCardMandates] = useState<MandateItem[]>([]);
  const [upiMandates, setUpiMandates] = useState<MandateItem[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingMandates, setLoadingMandates] = useState(false);
  const [mandatesLoaded, setMandatesLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubs = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/subscriptions?health=true");
      const json = await res.json() as SubsResponse;
      if (json.success) {
        setSubs(json.data.items);
        setHealth(json.data.health);
      }
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  const fetchMandates = useCallback(async () => {
    if (mandatesLoaded) return;
    setLoadingMandates(true);
    try {
      const res = await fetch("/api/subscriptions/mandates");
      const json = await res.json() as MandatesResponse;
      if (json.success) {
        setCardMandates(json.data.cardMandates);
        setUpiMandates(json.data.upiMandates);
        setMandatesLoaded(true);
      }
    } finally {
      setLoadingMandates(false);
    }
  }, [mandatesLoaded]);

  useEffect(() => { void fetchSubs(); }, [fetchSubs]);

  useEffect(() => {
    if (tab === "mandates" || tab === "upi") void fetchMandates();
  }, [tab, fetchMandates]);

  const handleStatusChange = async (id: string, status: string, isActive: boolean) => {
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, isActive }),
    });
    await fetchSubs();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubs();
    if (mandatesLoaded) {
      setMandatesLoaded(false);
      await fetchMandates();
    }
    setRefreshing(false);
  };

  const active = subs.filter((s) => s.isActive && s.status !== "EXPIRED" && s.status !== "CANCELLED");
  const dormant = subs.filter((s) => s.status === "DORMANT");
  const expired = subs.filter((s) => !s.isActive || s.status === "EXPIRED" || s.status === "CANCELLED");
  const upcoming = health?.upcomingRenewals ?? [];

  const monthlyTotal = active.reduce((s, i) => s + i.monthlyEquivalent, 0);
  const yearlyTotal = active.reduce((s, i) => s + i.yearlyEquivalent, 0);

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Repeat2 className="w-5 h-5 text-accent-light" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Subscriptions</h1>
            <p className="text-xs text-ink-muted mt-0.5">Quiet recurring financial gravity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       border border-glass-border text-ink-muted hover:text-ink
                       hover:bg-white/5 transition-all disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                             border border-income/30 bg-income/10 text-income
                             hover:bg-income/20 transition-all">
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Stat pills */}
      {!loadingSubs && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Active", value: String(active.length), sub: "subscriptions" },
            { label: "Dormant", value: String(dormant.length), sub: "unused", alert: dormant.length > 0 },
            { label: "Monthly", value: formatCurrency(monthlyTotal), sub: "recurring" },
            { label: "Annual", value: formatCurrency(yearlyTotal), sub: "commitment" },
          ].map((s) => (
            <div key={s.label} className={cn(
              "glass-card p-3 text-center",
              s.alert && "border-amber-400/20"
            )}>
              <p className="text-[9px] text-ink-faint uppercase tracking-wider">{s.label}</p>
              <p className={cn(
                "text-base font-semibold tabular-nums mt-1",
                s.alert ? "text-amber-400" : "text-ink"
              )}>
                {s.value}
              </p>
              <p className="text-[9px] text-ink-faint mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                tab === t.id
                  ? "bg-accent/15 text-accent-light border border-accent/25"
                  : "text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {t.label}
              {t.id === "upcoming" && upcoming.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400/15 text-amber-400 border border-amber-400/20">
                  {upcoming.length}
                </span>
              )}
              {t.id === "expired" && expired.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-expense/10 text-expense border border-expense/20">
                  {expired.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active tab ── */}
      {tab === "active" && (
        <div className="space-y-4">
          {health && <SubscriptionHealthScore health={health} />}

          {loadingSubs ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Repeat2 className="w-10 h-10 text-ink-faint mx-auto mb-3" />
              <p className="text-sm text-ink-muted">
                No active subscriptions. Sync Gmail to auto-detect recurring charges.
              </p>
            </div>
          ) : (
            <>
              {dormant.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
                  <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {dormant.length} dormant subscription{dormant.length > 1 ? "s" : ""} — charging with no usage signals
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {active.map((sub) => (
                  <SubscriptionCard key={sub.id} sub={sub} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Expired tab ── */}
      {tab === "expired" && (
        <div className="space-y-2">
          {expired.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-xs text-ink-muted">No expired subscriptions on record.</p>
            </div>
          ) : (
            expired.map((sub) => (
              <SubscriptionCard key={sub.id} sub={sub} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      )}

      {/* ── Upcoming renewals tab ── */}
      {tab === "upcoming" && (
        loadingSubs ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-2xl" />
            ))}
          </div>
        ) : (
          <RenewalCalendar renewals={upcoming} />
        )
      )}

      {/* ── Card mandates tab ── */}
      {tab === "mandates" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent-light" />
            <p className="text-xs text-ink-muted">
              RBI e-mandates and card auto-debit registrations
            </p>
          </div>
          {loadingMandates ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl" />
              ))}
            </div>
          ) : cardMandates.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <CreditCard className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-xs text-ink-muted">No card mandates detected yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cardMandates.map((m) => <MandateCard key={m.id} mandate={m} />)}
            </div>
          )}
        </div>
      )}

      {/* ── UPI Autopay tab ── */}
      {tab === "upi" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-income" />
            <p className="text-xs text-ink-muted">
              UPI autopay registrations and recurring mandates
            </p>
          </div>
          {loadingMandates ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl" />
              ))}
            </div>
          ) : upiMandates.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Smartphone className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-xs text-ink-muted">No UPI autopay mandates detected yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upiMandates.map((m) => <MandateCard key={m.id} mandate={m} />)}
            </div>
          )}
        </div>
      )}

      {/* ── AI Insights tab ── */}
      {tab === "insights" && (
        <SubscriptionInsightPanel />
      )}
    </div>
  );
}
