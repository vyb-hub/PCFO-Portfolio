"use client";

import { useState } from "react";
import { BrainCircuit, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { InsightDTO, InsightSeverity } from "@/types";
import { formatDistanceToNow, parseISO } from "date-fns";

interface Props {
  insights: InsightDTO[];
  onRefresh?: () => void;
}

const SEVERITY_CONFIG: Record<InsightSeverity, {
  badge: string;
  dot: string;
  label: string;
}> = {
  INFO: { badge: "badge-info", dot: "bg-blue-400", label: "Info" },
  SUCCESS: { badge: "badge-success", dot: "bg-income", label: "Positive" },
  WARNING: { badge: "badge-warning", dot: "bg-warning", label: "Warning" },
  ALERT: { badge: "badge-alert", dot: "bg-expense", label: "Alert" },
};

export function InsightPanel({ insights, onRefresh }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const visible = insights.filter((i) => !dismissed.has(i.id));

  const handleDismiss = async (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    await fetch("/api/insights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch("/api/insights", { method: "POST" });
    setGenerating(false);
    onRefresh?.();
  };

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-muted border border-accent-border flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">AI Insight Panel</h2>
            <p className="text-[11px] text-ink-muted">
              {visible.length} observation{visible.length !== 1 ? "s" : ""} · Updated regularly
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-muted hover:bg-accent/20
                     border border-accent-border text-accent-light text-xs font-medium
                     transition-all disabled:opacity-60"
        >
          <Sparkles className={cn("w-3 h-3", generating && "animate-pulse")} />
          {generating ? "Generating..." : "Generate insights"}
        </button>
      </div>

      {/* Insights grid */}
      {visible.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-ink-muted text-sm">
            No insights yet. Sync your emails and generate insights to see observations here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={() => void handleDismiss(insight.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  onDismiss,
}: {
  insight: InsightDTO;
  onDismiss: () => void;
}) {
  const config = SEVERITY_CONFIG[insight.severity];

  return (
    <div className={cn(
      "relative p-4 rounded-xl border transition-all group",
      insight.severity === "ALERT"
        ? "bg-expense-muted border-expense-border"
        : insight.severity === "WARNING"
        ? "bg-warning-muted border-warning/20"
        : insight.severity === "SUCCESS"
        ? "bg-income-muted border-income-border"
        : "bg-white/3 border-glass-border"
    )}>
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity
                   text-ink-faint hover:text-ink-muted"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Severity dot + badge */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", config.badge)}>
          {config.label}
        </span>
        <span className="text-[10px] text-ink-faint ml-auto pr-6">
          {formatDistanceToNow(parseISO(insight.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-ink mb-1 leading-snug">
        {insight.title}
      </h3>

      {/* Body */}
      <p className="text-xs text-ink-muted leading-relaxed">{insight.body}</p>
    </div>
  );
}
