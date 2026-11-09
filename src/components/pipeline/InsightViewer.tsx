"use client";

import { JsonViewer } from "./JsonViewer";
import { cn } from "@/lib/utils/cn";

interface FinancialInsight {
  id: string;
  metric: string;
  category: string;
  type: string;
  severity: string;
  title: string;
  summary: string;
  details: string;
  confidence: number;
  supportingMetrics: string[];
  createdAt: string;
}

interface InsightSnapshot {
  userId: string;
  generatedAt: string;
  insights: FinancialInsight[];
  failures: Array<{ generatorId: string; errorMessage: string }>;
  summary: { totalInsights: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number };
  metadata: { generatorsRun: number; generatorFailures: number };
}

interface Props {
  snapshot: InsightSnapshot;
  showRaw?: boolean;
  onSelectInsight?: (id: string) => void;
  highlightIds?: ReadonlyArray<string>;
}

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-expense/15 text-expense border-expense/30",
  HIGH:     "bg-warning/15 text-warning border-warning/30",
  MEDIUM:   "bg-accent/10 text-accent border-accent/20",
  LOW:      "bg-white/5 text-ink-muted border-white/10",
};

const TYPE_STYLE: Record<string, string> = {
  RISK:        "bg-expense/15 text-expense",
  WARNING:     "bg-warning/15 text-warning",
  OPPORTUNITY: "bg-income/15 text-income",
  POSITIVE:    "bg-income/15 text-income",
  NEUTRAL:     "bg-white/8 text-ink-muted",
  MILESTONE:   "bg-accent/15 text-accent",
};

export function InsightViewer({ snapshot, showRaw, onSelectInsight, highlightIds }: Props) {
  if (showRaw) return <JsonViewer data={snapshot} defaultExpanded />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 flex-wrap">
        <Stat label="Total" value={String(snapshot.summary.totalInsights)} />
        {snapshot.summary.criticalCount > 0 && <Stat label="Critical" value={String(snapshot.summary.criticalCount)} red />}
        {snapshot.summary.highCount > 0 && <Stat label="High" value={String(snapshot.summary.highCount)} warn />}
        <Stat label="Medium" value={String(snapshot.summary.mediumCount)} />
        <Stat label="Low" value={String(snapshot.summary.lowCount)} />
      </div>

      {snapshot.insights.length === 0 ? (
        <div className="text-xs font-mono text-ink-faint text-center py-8">
          No insights generated — insufficient financial data.
        </div>
      ) : (
        <div className="space-y-3">
          {snapshot.insights.map((insight) => {
            const highlighted = highlightIds?.includes(insight.id);
            return (
              <InsightCard
                key={insight.id}
                insight={insight}
                highlighted={highlighted}
                onClick={onSelectInsight ? () => onSelectInsight(insight.id) : undefined}
              />
            );
          })}
        </div>
      )}

      {snapshot.failures.length > 0 && (
        <div className="rounded-xl border border-expense/30 bg-expense/5 p-4">
          <div className="text-xs font-mono text-expense mb-2 uppercase tracking-wider">Generator Failures</div>
          {snapshot.failures.map((f, i) => (
            <div key={i} className="text-xs font-mono text-ink-muted">
              <span className="text-expense">{f.generatorId}</span>: {f.errorMessage}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  highlighted,
  onClick,
}: {
  insight: FinancialInsight;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const severityClass = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.LOW!;
  const typeClass = TYPE_STYLE[insight.type] ?? TYPE_STYLE.NEUTRAL!;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2 transition-all",
        highlighted ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20" : "border-white/10 bg-surface-1",
        onClick && "cursor-pointer hover:border-white/20",
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 flex-wrap">
        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border", severityClass)}>
          {insight.severity}
        </span>
        <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full", typeClass)}>
          {insight.type}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/8 text-ink-muted">
          {insight.metric.replace(/_/g, " ")}
        </span>
        <span className="text-[10px] font-mono text-ink-faint ml-auto">
          {(insight.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <div className="text-sm font-semibold text-ink">{insight.title}</div>
      <div className="text-xs text-ink-muted leading-relaxed">{insight.summary}</div>
      {insight.details !== insight.summary && (
        <div className="text-xs text-ink-faint leading-relaxed">{insight.details}</div>
      )}
      {insight.supportingMetrics.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {insight.supportingMetrics.map((m) => (
            <span key={m} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-ink-faint">
              {m.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
      <div className="text-[10px] font-mono text-ink-faint">id: {insight.id}</div>
    </div>
  );
}

function Stat({ label, value, red, warn }: { label: string; value: string; red?: boolean; warn?: boolean }) {
  return (
    <div className="text-xs font-mono">
      <span className="text-ink-faint">{label}: </span>
      <span className={red ? "text-expense" : warn ? "text-warning" : "text-ink"}>{value}</span>
    </div>
  );
}
