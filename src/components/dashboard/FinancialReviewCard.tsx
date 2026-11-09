"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Local types (mirror pipeline output shape) ─────────────────
interface MetricResult { type: string; value: number; unit: string }
interface Insight      { severity: string; title: string; summary: string }
interface Recommendation { priority: string; title: string; action: string; rationale: string }

interface ReviewData {
  tier: string;
  score: number;
  headline: string;
  summary: string;
  metrics: MetricResult[];
  insights: Insight[];
  topRec: Recommendation | null;
  durationMs: number;
  period: string;
}

// ── Formatting helpers ────────────────────────────────────────
function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000)   return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  return `${sign}₹${abs.toFixed(0)}`;
}
function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

const METRIC_FMT: Record<string, (v: number) => string> = {
  PERCENTAGE: fmtPct,
  RATIO:      (v) => v.toFixed(2),
  CURRENCY:   fmtCurrency,
  MONTHS:     (v) => `${v.toFixed(1)}mo`,
  COUNT:      (v) => v.toFixed(0),
};

// ── Tier styling ──────────────────────────────────────────────
const TIER: Record<string, { label: string; color: string; ring: string; bg: string }> = {
  EXCELLENT:       { label: "Excellent",       color: "text-income",       ring: "ring-income/40",   bg: "bg-income/10"   },
  GOOD:            { label: "Good",            color: "text-accent-light", ring: "ring-accent/40",   bg: "bg-accent/10"   },
  FAIR:            { label: "Fair",            color: "text-warning",      ring: "ring-warning/40",  bg: "bg-warning/10"  },
  NEEDS_ATTENTION: { label: "Needs Attention", color: "text-warning",      ring: "ring-warning/40",  bg: "bg-warning/10"  },
  CRITICAL:        { label: "Critical",        color: "text-expense",      ring: "ring-expense/40",  bg: "bg-expense/10"  },
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: "bg-expense",
  HIGH:     "bg-warning",
  MEDIUM:   "bg-accent",
  LOW:      "bg-ink-faint",
};

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: "border-expense/40 bg-expense/5  text-expense",
  HIGH:     "border-warning/40 bg-warning/5  text-warning",
  MEDIUM:   "border-accent/30  bg-accent/5   text-accent-light",
  LOW:      "border-white/10   bg-white/3    text-ink-muted",
};

const KEY_METRICS = ["SAVINGS_RATE", "CASH_FLOW", "BURN_RATE"];
const METRIC_LABEL: Record<string, string> = {
  SAVINGS_RATE: "Savings Rate",
  CASH_FLOW:    "Cash Flow",
  BURN_RATE:    "Monthly Burn",
};

// ─────────────────────────────────────────────────────────────
export function FinancialReviewCard() {
  const [data, setData]       = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/finance/pipeline");
      const json = await res.json() as { success: boolean; data?: Record<string, unknown>; error?: string };
      if (!json.success || !json.data) { setError(json.error ?? "No data"); return; }

      const d     = json.data as Record<string, any>;
      const rev   = d.review as any;
      const exec  = rev?.executiveSummary as any;
      const recs  = (d.recommendationSnapshot as any)?.recommendations as Recommendation[] ?? [];
      const period = (d.metricsSnapshot as any)?.period?.label ?? "";

      setData({
        tier:       exec?.healthTier ?? "FAIR",
        score:      exec?.overallHealthScore ?? 0,
        headline:   exec?.headline ?? "",
        summary:    exec?.summary ?? "",
        metrics:    (d.metricsSnapshot as any)?.results ?? [],
        insights:   (d.insightSnapshot as any)?.insights ?? [],
        topRec:     recs[0] ?? null,
        durationMs: (d.metadata as any)?.durationMs ?? 0,
        period,
      });
    } catch {
      setError("Could not load financial review");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <ReviewSkeleton />;
  if (error)   return <ReviewError error={error} onRetry={load} />;
  if (!data)   return null;

  const tier    = TIER[data.tier] ?? TIER.FAIR!;
  const pct     = Math.round(data.score * 100);
  const keyMets = KEY_METRICS.map(t => data.metrics.find(m => m.type === t)).filter(Boolean) as MetricResult[];
  const topInsights = data.insights.filter(i => i.severity === "CRITICAL" || i.severity === "HIGH").slice(0, 3);

  return (
    <div className="glass-card p-5 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-ink">Financial Review</span>
          {data.period && (
            <span className="text-[10px] font-mono text-ink-faint px-2 py-0.5 rounded-full bg-white/5 border border-white/8">
              {data.period}
            </span>
          )}
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 text-[10px] font-mono text-ink-faint hover:text-ink-muted
                     px-2.5 py-1 rounded-lg bg-white/4 hover:bg-white/8 border border-white/8 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* ── Main row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Health score */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative w-16 h-16 rounded-full ring-2 flex items-center justify-center flex-shrink-0",
            tier.ring, tier.bg,
          )}>
            <span className={cn("text-xl font-bold tabular-nums", tier.color)}>{pct}</span>
            <span className={cn("absolute bottom-1 text-[8px] font-mono", tier.color)}>pts</span>
          </div>
          <div className="min-w-0">
            <div className={cn("text-xs font-semibold mb-0.5", tier.color)}>{tier.label}</div>
            <div className="text-sm font-medium text-ink leading-snug line-clamp-2">{data.headline}</div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="flex flex-col gap-2">
          {keyMets.map(m => {
            const fmt   = METRIC_FMT[m.unit] ?? ((v: number) => v.toFixed(2));
            const val   = fmt(m.value);
            const isNeg = m.value < 0;
            const isPos = m.value > 0;
            const color = m.type === "SAVINGS_RATE" || m.type === "CASH_FLOW"
              ? isNeg ? "text-expense" : isPos ? "text-income" : "text-ink-muted"
              : "text-ink";
            return (
              <div key={m.type} className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{METRIC_LABEL[m.type]}</span>
                <div className="flex items-center gap-1">
                  {m.type !== "BURN_RATE" && (
                    isNeg
                      ? <TrendingDown className="w-3 h-3 text-expense" />
                      : isPos
                        ? <TrendingUp className="w-3 h-3 text-income" />
                        : null
                  )}
                  <span className={cn("text-sm font-semibold tabular-nums", color)}>{val}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top recommendation */}
        {data.topRec && (
          <div className={cn(
            "rounded-xl border p-3 space-y-1.5 text-xs",
            PRIORITY_STYLE[data.topRec.priority] ?? PRIORITY_STYLE.MEDIUM!,
          )}>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 flex-shrink-0" />
              <span className="font-semibold uppercase tracking-wide text-[9px]">
                {data.topRec.priority} priority
              </span>
            </div>
            <p className="font-medium leading-snug">{data.topRec.title}</p>
            <p className="text-[10px] opacity-70 leading-relaxed line-clamp-2">{data.topRec.rationale}</p>
          </div>
        )}
      </div>

      {/* ── Critical / High insights ── */}
      {topInsights.length > 0 && (
        <div className="pt-4 border-t border-white/6 space-y-2">
          <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">Key signals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {topInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/4 border border-white/8 px-3 py-2.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                  SEVERITY_DOT[ins.severity] ?? "bg-ink-faint",
                )} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink leading-snug">{ins.title}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5 leading-relaxed line-clamp-2">{ins.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 skeleton rounded" />
        <div className="h-4 w-16 skeleton rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 skeleton rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-16 skeleton rounded" />
            <div className="h-4 w-full skeleton rounded" />
          </div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-4 skeleton rounded" />)}
        </div>
        <div className="h-24 skeleton rounded-xl" />
      </div>
    </div>
  );
}

function ReviewError({ error, onRetry }: { error: string; onRetry: () => void }) {
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
