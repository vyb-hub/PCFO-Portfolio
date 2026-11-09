"use client";

import { useState } from "react";
import { PipelineSidebar, type PipelineLayer } from "./PipelineSidebar";
import { MetricsViewer } from "./MetricsViewer";
import { AnalyticsViewer } from "./AnalyticsViewer";
import { InsightViewer } from "./InsightViewer";
import { RecommendationViewer } from "./RecommendationViewer";
import { ReviewViewer } from "./ReviewViewer";
import { TraceabilityViewer } from "./TraceabilityViewer";
import { CalibrationPanel } from "./CalibrationPanel";
import { JsonViewer } from "./JsonViewer";
import { cn } from "@/lib/utils/cn";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>;

interface Props {
  data: unknown;
  error: string | null;
}

export function PipelineInspector({ data, error }: Props) {
  const [activeLayer, setActiveLayer] = useState<PipelineLayer>("aggregate");
  const [showRaw, setShowRaw] = useState(false);

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-8">
        <div className="rounded-2xl border border-expense/40 bg-expense/8 p-8 max-w-lg w-full space-y-3">
          <div className="text-sm font-mono font-bold text-expense">Pipeline Error</div>
          <div className="text-xs font-mono text-ink-muted leading-relaxed">{error}</div>
          <div className="text-xs text-ink-faint mt-2">
            Check that you have transactions, debts, goals, or budgets in the database.
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-xs font-mono text-ink-faint">Loading pipeline…</div>
      </div>
    );
  }

  const d = data as AnyData;
  const rec = d.recommendationSnapshot;
  const ins = d.insightSnapshot;
  const ana = d.analyticsSnapshot;
  const met = d.metricsSnapshot;

  // Build sidebar badges from snapshot summaries
  const badges: Partial<Record<PipelineLayer, { label: string; color: string }>> = {};

  if (met?.failures?.length > 0) {
    badges.metrics = { label: `${met.failures.length} err`, color: "bg-expense/15 text-expense" };
  }
  if (ana?.metadata?.analyzersSkipped > 0) {
    badges.analytics = { label: `${ana.metadata.analyzersSkipped} skip`, color: "bg-warning/15 text-warning" };
  }
  if (ins?.summary?.criticalCount > 0 || ins?.summary?.highCount > 0) {
    const count = (ins.summary.criticalCount ?? 0) + (ins.summary.highCount ?? 0);
    badges.insights = { label: `${count} !`, color: count > 0 ? "bg-warning/15 text-warning" : "bg-white/8 text-ink-faint" };
  }
  if (rec?.metadata?.criticalRecommendations > 0) {
    badges.recommendations = { label: `${rec.metadata.criticalRecommendations} crit`, color: "bg-expense/15 text-expense" };
  }

  const review = d.review;
  if (review?.executiveSummary?.healthTier) {
    const TIER_BADGE: Record<string, { label: string; color: string }> = {
      EXCELLENT:       { label: "EXCELLENT",  color: "bg-income/15 text-income" },
      GOOD:            { label: "GOOD",        color: "bg-income/10 text-income" },
      FAIR:            { label: "FAIR",        color: "bg-accent/15 text-accent" },
      NEEDS_ATTENTION: { label: "⚠ NEEDS ATN", color: "bg-warning/15 text-warning" },
      CRITICAL:        { label: "CRITICAL",    color: "bg-expense/15 text-expense" },
    };
    badges.review = TIER_BADGE[review.executiveSummary.healthTier] ?? badges.review;
  }

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      <PipelineSidebar active={activeLayer} onSelect={setActiveLayer} badges={badges} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/8 bg-surface/40 shrink-0">
          <div>
            <div className="text-sm font-medium text-ink">{layerTitle(activeLayer)}</div>
            <div className="text-[10px] font-mono text-ink-faint mt-0.5">{layerDescription(activeLayer)}</div>
          </div>
          <div className="flex items-center gap-3">
            {d.metadata?.durationMs !== undefined && (
              <div className="text-[10px] font-mono text-ink-faint">
                ran in {d.metadata.durationMs}ms
              </div>
            )}
            <button
              onClick={() => setShowRaw((v) => !v)}
              className={cn(
                "text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all",
                showRaw
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/10 text-ink-muted hover:border-white/20 hover:text-ink",
              )}
            >
              {showRaw ? "Rendered" : "Raw JSON"}
            </button>
          </div>
        </header>

        {/* Layer content */}
        <div className="flex-1 overflow-y-auto p-6">
          <LayerContent
            layer={activeLayer}
            data={d}
            showRaw={showRaw}
          />
        </div>
      </div>
    </div>
  );
}

function LayerContent({ layer, data, showRaw }: { layer: PipelineLayer; data: AnyData; showRaw: boolean }) {
  switch (layer) {
    case "aggregate":
      return showRaw
        ? <JsonViewer data={data.aggregate} defaultExpanded />
        : <AggregateViewer aggregate={data.aggregate} />;

    case "metrics":
      return <MetricsViewer snapshot={data.metricsSnapshot} showRaw={showRaw} />;

    case "analytics":
      return <AnalyticsViewer snapshot={data.analyticsSnapshot} showRaw={showRaw} />;

    case "insights":
      return <InsightViewer snapshot={data.insightSnapshot} showRaw={showRaw} />;

    case "recommendations":
      return <RecommendationViewer snapshot={data.recommendationSnapshot} showRaw={showRaw} />;

    case "review":
      return <ReviewViewer review={data.review} showRaw={showRaw} />;

    case "traceability":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <TraceabilityViewer data={data as any} />;

    case "calibration":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <CalibrationPanel data={data as any} />;

    default:
      return <JsonViewer data={data} defaultExpanded />;
  }
}

// Minimal aggregate viewer — shows transaction/debt/goal counts and period
function AggregateViewer({ aggregate }: { aggregate: AnyData }) {
  if (!aggregate) return <JsonViewer data={aggregate} defaultExpanded />;

  const txCount     = aggregate.transactions?.length ?? 0;
  const debtCount   = aggregate.debts?.length ?? 0;
  const goalCount   = aggregate.goals?.length ?? 0;
  const budgetCount = aggregate.budgets?.length ?? 0;
  const recurringCount = aggregate.recurringPayments?.length ?? 0;
  const incomeCount = aggregate.income?.all?.length ?? 0;
  const expenseCount = aggregate.expenses?.all?.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Period + summary */}
      <div className="rounded-xl border border-white/10 bg-surface-1 p-4 space-y-3">
        <div className="text-xs font-mono text-ink-faint">Period</div>
        <div className="text-2xl font-bold font-mono text-ink">{aggregate.period?.label ?? "—"}</div>
        <div className="text-xs font-mono text-ink-faint">{aggregate.period?.granularity} · {aggregate.userId}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CountCard label="Total Transactions" value={txCount} />
        <CountCard label="Income Transactions" value={incomeCount} color="text-income" />
        <CountCard label="Expense Transactions" value={expenseCount} color="text-expense" />
        <CountCard label="Active Debts" value={debtCount} color={debtCount > 0 ? "text-warning" : "text-ink"} />
        <CountCard label="Active Goals" value={goalCount} />
        <CountCard label="Budgets" value={budgetCount} />
        <CountCard label="Recurring Payments" value={recurringCount} />
        <CountCard label="Investments" value={aggregate.investments?.length ?? 0} warn="No Investment model in DB — CF-001" />
      </div>

      {aggregate.categoryBreakdown && Object.keys(aggregate.categoryBreakdown).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-surface-1 p-4">
          <div className="text-xs font-mono text-ink-faint mb-3">Category Breakdown</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(aggregate.categoryBreakdown as Record<string, AnyData>).map(([cat, val]) => (
              <div key={cat} className="text-xs font-mono">
                <span className="text-ink-faint">{cat}: </span>
                <span className="text-ink">{val?.totalAmount?.amount !== undefined
                  ? `₹${Number(val.totalAmount.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                  : "—"
                }</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="rounded-xl border border-white/10 bg-surface-1 p-4">
        <summary className="text-xs font-mono text-ink-faint cursor-pointer">Full Aggregate JSON</summary>
        <div className="mt-3">
          <JsonViewer data={aggregate} defaultExpanded={false} />
        </div>
      </details>
    </div>
  );
}

function CountCard({ label, value, color = "text-ink", warn }: {
  label: string;
  value: number;
  color?: string;
  warn?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-1 p-4">
      <div className="text-[10px] font-mono text-ink-faint">{label}</div>
      <div className={cn("text-2xl font-bold font-mono mt-1", color)}>{value}</div>
      {warn && value === 0 && (
        <div className="text-[10px] font-mono text-ink-faint mt-1 leading-relaxed">{warn}</div>
      )}
    </div>
  );
}

function layerTitle(layer: PipelineLayer): string {
  const titles: Record<PipelineLayer, string> = {
    aggregate:       "Financial Aggregate",
    metrics:         "Metrics Snapshot",
    analytics:       "Analytics Snapshot",
    insights:        "Insight Snapshot",
    recommendations: "Recommendation Snapshot",
    review:          "Financial Review",
    traceability:    "Traceability Explorer",
    calibration:     "Calibration Dashboard",
  };
  return titles[layer];
}

function layerDescription(layer: PipelineLayer): string {
  const descs: Record<PipelineLayer, string> = {
    aggregate:       "Raw financial data for the current month — the input to the entire pipeline",
    metrics:         "Computed KPIs from the aggregate — the foundation for all analysis",
    analytics:       "Pattern findings across historical snapshots — trends, variance, risk",
    insights:        "Human-readable observations about metric states and trends",
    recommendations: "Prioritised, actionable suggestions derived from insights and analytics",
    review:          "Assembled monthly summary — the final output of the pipeline",
    traceability:    "Trace any recommendation backwards: → insights → findings → metrics",
    calibration:     "Pipeline health, known assumptions, skipped analyzers, and failures",
  };
  return descs[layer];
}
