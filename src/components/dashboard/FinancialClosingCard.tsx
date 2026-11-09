"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProgressRing } from "@/components/mission/ProgressRing";

interface ChecklistItemData {
  id: string;
  label: string;
  statementType: string;
  status: "PENDING" | "SATISFIED";
}

interface MonthData {
  id: string;
  periodLabel: string;
  status: "OPEN" | "COLLECTING_DATA" | "READY_TO_CLOSE" | "CLOSED" | "ARCHIVED";
  salaryConfirmed: boolean;
  checklistItems: ChecklistItemData[];
  completionPercent: number;
}

interface LatestClosed {
  periodLabel: string;
  closedAt: string;
}

interface ClosingData {
  month: MonthData;
  latestClosed: LatestClosed | null;
}

const STATUS: Record<string, { label: string; color: string; ring: string; bg: string }> = {
  OPEN:            { label: "Open",            color: "text-ink-muted",    ring: "ring-white/15",  bg: "bg-white/5"  },
  COLLECTING_DATA: { label: "Collecting Data", color: "text-accent-light", ring: "ring-accent/40", bg: "bg-accent/10" },
  READY_TO_CLOSE:  { label: "Ready to Close",  color: "text-income",      ring: "ring-income/40", bg: "bg-income/10" },
  CLOSED:          { label: "Closed",          color: "text-ink-muted",   ring: "ring-white/15",  bg: "bg-white/5"  },
  ARCHIVED:        { label: "Archived",        color: "text-ink-faint",   ring: "ring-white/10",  bg: "bg-white/3"  },
};

const REQUIREMENT_TYPES = [
  { value: "BANK", label: "Bank" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "OTHER", label: "Other" },
];

export function FinancialClosingCard() {
  const [data, setData] = useState<ClosingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"idle" | "loading" | "done">("idle");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("BANK");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/financial-months/current");
      const json = await res.json() as { success: boolean; data?: ClosingData; error?: string };
      if (!json.success || !json.data) { setError(json.error ?? "No data"); return; }
      setData(json.data);
    } catch {
      setError("Could not load closing status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <ClosingSkeleton />;
  if (error) return <ClosingError error={error} onRetry={load} />;
  if (!data) return null;

  const { month, latestClosed } = data;
  const status = STATUS[month.status] ?? STATUS.OPEN!;
  const pending = month.checklistItems.filter(i => i.status === "PENDING");

  async function handleConfirmSalary() {
    setBusy("salary");
    try {
      await fetch(`/api/financial-months/${month.id}/confirm-salary`, { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function handleSyncDebts() {
    setBusy("sync-debts");
    try {
      await fetch("/api/financial-months/settings/requirements/sync-debts", { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function handleAddRequirement() {
    if (!newLabel.trim()) return;
    setBusy("add-requirement");
    try {
      await fetch("/api/financial-months/settings/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), statementType: newType }),
      });
      setNewLabel("");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateReview() {
    setReviewStatus("loading");
    try {
      await fetch("/api/finance/pipeline");
      setReviewStatus("done");
      setTimeout(() => setReviewStatus("idle"), 3000);
    } catch {
      setReviewStatus("idle");
    }
  }

  async function handleClose() {
    setBusy("close");
    setCloseError(null);
    try {
      const res = await fetch(`/api/financial-months/${month.id}/close`, { method: "POST" });
      const json = await res.json() as { success: boolean; error?: string; data?: { missingItems?: string[] } };
      if (!json.success) {
        const missing = json.data?.missingItems ?? [];
        setCloseError(
          json.error === "NOT_READY_TO_CLOSE"
            ? `Not ready yet — still missing: ${missing.length > 0 ? missing.join(", ") : "salary confirmation"}.`
            : json.error ?? "Failed to close month",
        );
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-ink">Financial Closing</span>
          <span className="text-[10px] font-mono text-ink-faint px-2 py-0.5 rounded-full bg-white/5 border border-white/8">
            {month.periodLabel}
          </span>
        </div>
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1",
          status.color, status.ring, status.bg,
        )}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion ring */}
        <div className="flex items-center gap-4">
          <ProgressRing
            progress={month.completionPercent / 100}
            size={72}
            strokeWidth={6}
            color="#10b981"
            label={`${month.completionPercent}%`}
          />
          <div className="min-w-0 text-xs text-ink-muted">
            {pending.length === 0 && month.salaryConfirmed
              ? "Everything's in."
              : `${pending.length + (month.salaryConfirmed ? 0 : 1)} item(s) outstanding.`}
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          {month.checklistItems.length === 0 && (
            <p className="text-xs text-ink-faint">No statement requirements configured yet.</p>
          )}
          {month.checklistItems.map(item => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-ink-muted">
                {item.status === "SATISFIED"
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-income flex-shrink-0" />
                  : <Circle className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />}
                {item.label}
              </span>
              <span className={cn("text-[10px] uppercase", item.status === "SATISFIED" ? "text-income" : "text-ink-faint")}>
                {item.status === "SATISFIED" ? "Done" : "Pending"}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/6">
            <span className="flex items-center gap-1.5 text-ink-muted">
              {month.salaryConfirmed
                ? <CheckCircle2 className="w-3.5 h-3.5 text-income flex-shrink-0" />
                : <Circle className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />}
              Salary
            </span>
            {!month.salaryConfirmed && (
              <button
                onClick={() => void handleConfirmSalary()}
                disabled={busy === "salary"}
                className="text-[10px] text-accent-light hover:underline disabled:opacity-40"
              >
                {busy === "salary" ? "Confirming…" : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add requirement (manual) + sync loans from Debts */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/6">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Add a statement, e.g. HDFC Savings"
          className="flex-1 text-xs bg-white/4 border border-white/8 rounded-lg px-2.5 py-1.5 text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent/40"
        />
        <select
          value={newType}
          onChange={e => setNewType(e.target.value)}
          className="text-xs bg-white/4 border border-white/8 rounded-lg px-2 py-1.5 text-ink-muted"
        >
          {REQUIREMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          onClick={() => void handleAddRequirement()}
          disabled={busy === "add-requirement" || !newLabel.trim()}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border text-ink-muted hover:text-ink disabled:opacity-40 transition-all"
        >
          Add
        </button>
        <button
          onClick={() => void handleSyncDebts()}
          disabled={busy === "sync-debts"}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border text-ink-muted hover:text-ink disabled:opacity-40 transition-all whitespace-nowrap"
        >
          <RefreshCw className={cn("w-3 h-3", busy === "sync-debts" && "animate-spin")} />
          Sync Loans
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/6">
        <div className="text-[10px] text-ink-faint">
          {latestClosed ? `Last closed: ${latestClosed.periodLabel}` : "No month closed yet."}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleGenerateReview()}
            disabled={reviewStatus === "loading"}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border text-ink-muted hover:text-ink disabled:opacity-40 transition-all"
          >
            {reviewStatus === "loading" ? "Generating…" : reviewStatus === "done" ? "Refreshed ✓" : "Generate Review"}
          </button>
          <button
            onClick={() => void handleClose()}
            disabled={month.status !== "READY_TO_CLOSE" || busy === "close"}
            className="text-xs px-3 py-1.5 rounded-lg bg-income/10 hover:bg-income/20 border border-income/30 text-income disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {busy === "close" ? "Closing…" : "Close Month"}
          </button>
        </div>
      </div>

      {closeError && (
        <div className="flex items-center gap-2 text-[11px] text-warning">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {closeError}
        </div>
      )}
    </div>
  );
}

function ClosingSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 skeleton rounded" />
        <div className="h-4 w-20 skeleton rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] skeleton rounded-full flex-shrink-0" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
        <div className="space-y-2 md:col-span-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 skeleton rounded" />)}
        </div>
      </div>
    </div>
  );
}

function ClosingError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="glass-card p-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-sm text-ink-muted">
        <AlertTriangle className="w-4 h-4 text-warning" />
        {error}
      </div>
      <button onClick={onRetry} className="text-xs text-accent-light hover:underline">Retry</button>
    </div>
  );
}
