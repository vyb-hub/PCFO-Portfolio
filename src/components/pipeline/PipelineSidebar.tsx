"use client";

import { cn } from "@/lib/utils/cn";

export type PipelineLayer =
  | "aggregate"
  | "metrics"
  | "analytics"
  | "insights"
  | "recommendations"
  | "review"
  | "traceability"
  | "calibration";

interface LayerMeta {
  id: PipelineLayer;
  label: string;
  sublabel: string;
  badge?: string;
  badgeColor?: string;
  arrow?: boolean;
  divider?: boolean;
}

const LAYERS: LayerMeta[] = [
  { id: "aggregate",       label: "Financial Aggregate",       sublabel: "Raw data, this month",         arrow: true },
  { id: "metrics",         label: "Metrics Snapshot",          sublabel: "Computed KPIs",                arrow: true },
  { id: "analytics",       label: "Analytics Snapshot",        sublabel: "Pattern findings",             arrow: true },
  { id: "insights",        label: "Insight Snapshot",          sublabel: "Observations",                 arrow: true },
  { id: "recommendations", label: "Recommendation Snapshot",   sublabel: "Prioritised actions",          arrow: true },
  { id: "review",          label: "Financial Review",          sublabel: "Monthly summary",              divider: true },
  { id: "traceability",    label: "Traceability Explorer",     sublabel: "Trace any recommendation back" },
  { id: "calibration",     label: "Calibration Dashboard",     sublabel: "Assumptions & failures" },
];

interface Props {
  active: PipelineLayer;
  onSelect: (layer: PipelineLayer) => void;
  badges?: Partial<Record<PipelineLayer, { label: string; color: string }>>;
}

export function PipelineSidebar({ active, onSelect, badges }: Props) {
  return (
    <aside className="w-64 shrink-0 h-full border-r border-white/8 bg-surface/60 backdrop-blur-sm flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-ink">Pipeline Inspector</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent">DEV</span>
        </div>
        <div className="text-[10px] font-mono text-ink-faint mt-1">
          Financial Intelligence Platform
        </div>
      </div>

      {/* Pipeline layers */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {LAYERS.map((layer) => {
          const badge = badges?.[layer.id];
          return (
            <div key={layer.id}>
              {layer.divider && (
                <div className="my-2 border-t border-white/8" />
              )}
              <button
                onClick={() => onSelect(layer.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl transition-all",
                  active === layer.id
                    ? "bg-accent/10 border border-accent/25 text-ink"
                    : "hover:bg-white/5 text-ink-muted hover:text-ink border border-transparent",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className={cn("text-xs font-medium", active === layer.id ? "text-ink" : "text-ink-muted")}>
                      {layer.label}
                    </div>
                    <div className="text-[10px] font-mono text-ink-faint mt-0.5">{layer.sublabel}</div>
                  </div>
                  {badge && (
                    <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0", badge.color)}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </button>
              {layer.arrow && (
                <div className="text-ink-faint text-[10px] font-mono text-center leading-none py-0.5">↓</div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/8">
        <div className="text-[10px] font-mono text-ink-faint">Read-only · No writes · EC-011</div>
      </div>
    </aside>
  );
}
