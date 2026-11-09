"use client";

import { cn } from "@/lib/utils/cn";
import { Sparkles, RefreshCw, AlertTriangle, Info, CheckCircle, Zap } from "lucide-react";
import { useState } from "react";

export interface SubInsight {
  id: string;
  category: string;
  title: string;
  body: string;
  severity: "INFO" | "WARNING" | "ALERT";
  services: string[];
  missionImpact: string | null;
  actionable: boolean;
}

const SEVERITY_STYLE: Record<string, { border: string; bg: string; icon: React.ElementType; iconColor: string }> = {
  ALERT: {
    border: "border-expense/25",
    bg: "bg-expense/5",
    icon: AlertTriangle,
    iconColor: "text-expense",
  },
  WARNING: {
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  INFO: {
    border: "border-glass-border",
    bg: "bg-white/[0.02]",
    icon: Info,
    iconColor: "text-accent-light",
  },
};

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  dormant: { label: "Dormant", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  duplicate: { label: "Overlap", color: "text-expense bg-expense/10 border-expense/20" },
  pricehike: { label: "Price ↑", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  upcoming: { label: "Upcoming", color: "text-income bg-income/10 border-income/20" },
  mandate: { label: "Mandate", color: "text-accent-light bg-accent/10 border-accent/20" },
  mission: { label: "Mission", color: "text-income bg-income/10 border-income/20" },
  complexity: { label: "Complexity", color: "text-expense bg-expense/10 border-expense/20" },
  info: { label: "Info", color: "text-ink-muted bg-white/5 border-glass-border" },
};

interface InsightCardProps {
  insight: SubInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const style = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE["INFO"]!;
  const badge = CATEGORY_BADGE[insight.category] ?? CATEGORY_BADGE["info"]!;
  const SevIcon = style.icon;

  return (
    <div className={cn("rounded-2xl border p-4 space-y-2.5", style?.border, style?.bg)}>
      <div className="flex items-start gap-2.5">
        <SevIcon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", style?.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn(
              "text-[9px] font-medium px-1.5 py-0.5 rounded-full border",
              badge?.color
            )}>
              {badge?.label}
            </span>
            {insight.services.slice(0, 3).map((s) => (
              <span key={s} className="text-[9px] text-ink-faint">{s}</span>
            ))}
          </div>
          <p className="text-xs font-semibold text-ink leading-snug">{insight.title}</p>
          <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">{insight.body}</p>
        </div>
      </div>

      {insight.missionImpact && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-income/8 border border-income/15">
          <Zap className="w-3 h-3 text-income flex-shrink-0" />
          <p className="text-[10px] text-income font-medium">{insight.missionImpact}</p>
        </div>
      )}
    </div>
  );
}

interface Props {
  initialInsights?: SubInsight[];
}

export function SubscriptionInsightPanel({ initialInsights = [] }: Props) {
  const [insights, setInsights] = useState<SubInsight[]>(initialInsights);
  const [loading, setLoading] = useState(initialInsights.length === 0);
  const [regenerating, setRegenerating] = useState(false);

  const fetchInsights = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/subscriptions/insights");
      const json = await res.json() as { success: boolean; data: SubInsight[] };
      if (json.success) setInsights(json.data);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  if (loading && insights.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-28 skeleton" />
        ))}
      </div>
    );
  }

  const alerts = insights.filter((i) => i.severity === "ALERT");
  const warnings = insights.filter((i) => i.severity === "WARNING");
  const info = insights.filter((i) => i.severity === "INFO");
  const ordered = [...alerts, ...warnings, ...info];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-ink-muted">
            {ordered.length} subscription pattern{ordered.length !== 1 ? "s" : ""} detected
          </p>
        </div>
        <button
          onClick={() => void fetchInsights()}
          disabled={regenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                     border border-glass-border text-ink-muted hover:text-ink
                     hover:bg-white/5 transition-all disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3 h-3", regenerating && "animate-spin")} />
          Regenerate
        </button>
      </div>

      {ordered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <CheckCircle className="w-8 h-8 text-income mx-auto mb-2" />
          <p className="text-xs text-ink-muted">Subscription portfolio looks clean. Nothing notable detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
