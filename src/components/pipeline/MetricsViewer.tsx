"use client";

import { JsonViewer } from "./JsonViewer";
import { cn } from "@/lib/utils/cn";

interface MetricResult {
  type: string;
  value: number;
  unit: string;
  definition: { name: string; description: string; unit: string };
  calculatedAt: string;
}

interface MetricEvaluation {
  result: MetricResult;
  threshold: { min: number | null; max: number | null };
  isHealthy: boolean;
  distanceFromThreshold: number;
}

interface MetricsSnapshot {
  userId: string;
  period: { label: string; granularity: string };
  results: MetricResult[];
  evaluations: MetricEvaluation[];
  failures: Array<{ type: string; errorMessage: string }>;
  definitions: Array<{ type: string; name: string; description: string; unit: string }>;
  metadata: { generatedAt: string; totalAttempted: number; successfulMetrics: number; failedMetrics: number };
}

interface Props { snapshot: MetricsSnapshot; showRaw?: boolean }

const UNIT_FMT: Record<string, (v: number) => string> = {
  PERCENTAGE: (v) => `${(v * 100).toFixed(1)}%`,
  RATIO:      (v) => v.toFixed(3),
  CURRENCY:   (v) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
  MONTHS:     (v) => `${v.toFixed(1)} mo`,
  COUNT:      (v) => v.toFixed(0),
};

function fmtValue(value: number, unit: string): string {
  return (UNIT_FMT[unit] ?? ((v: number) => v.toFixed(2)))(value);
}

export function MetricsViewer({ snapshot, showRaw }: Props) {
  if (showRaw) return <JsonViewer data={snapshot} defaultExpanded />;

  const evalMap = new Map<string, MetricEvaluation>(
    snapshot.evaluations.map((e) => [e.result.type, e]),
  );

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex gap-4 flex-wrap">
        <Stat label="Period" value={snapshot.period.label} />
        <Stat label="Computed" value={`${snapshot.metadata.successfulMetrics}/${snapshot.metadata.totalAttempted}`} />
        {snapshot.failures.length > 0 && (
          <Stat label="Failures" value={String(snapshot.failures.length)} red />
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {snapshot.results.map((r) => {
          const ev = evalMap.get(r.type);
          const healthy = ev?.isHealthy ?? true;
          const dist = ev?.distanceFromThreshold ?? 0;
          return (
            <div
              key={r.type}
              className={cn(
                "rounded-xl border p-4 space-y-2 bg-surface-1",
                healthy ? "border-white/10" : "border-expense/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">{r.type.replace(/_/g, " ")}</div>
                  <div className="text-lg font-bold font-mono mt-1 text-ink">
                    {fmtValue(r.value, r.unit)}
                  </div>
                </div>
                <HealthBadge healthy={healthy} />
              </div>
              {ev && (
                <div className="text-xs font-mono text-ink-faint">
                  {ev.threshold.min !== null && <span>min {fmtValue(ev.threshold.min, r.unit)} </span>}
                  {ev.threshold.max !== null && <span>max {fmtValue(ev.threshold.max, r.unit)} </span>}
                  {!healthy && (
                    <span className="text-expense">
                      {dist < 0 ? `${fmtValue(Math.abs(dist), r.unit)} outside` : "at threshold"}
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs text-ink-faint leading-relaxed">{r.definition.description}</div>
            </div>
          );
        })}
      </div>

      {/* Failures */}
      {snapshot.failures.length > 0 && (
        <div className="rounded-xl border border-expense/30 bg-expense/5 p-4">
          <div className="text-xs font-mono text-expense mb-2 uppercase tracking-wider">Computation Failures</div>
          {snapshot.failures.map((f) => (
            <div key={f.type} className="text-xs font-mono text-ink-muted">
              <span className="text-expense">{f.type}</span>: {f.errorMessage}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthBadge({ healthy }: { healthy: boolean }) {
  return (
    <span className={cn(
      "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0",
      healthy ? "bg-income/15 text-income" : "bg-expense/15 text-expense",
    )}>
      {healthy ? "HEALTHY" : "UNHEALTHY"}
    </span>
  );
}

function Stat({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <div className="text-xs font-mono">
      <span className="text-ink-faint">{label}: </span>
      <span className={red ? "text-expense" : "text-ink"}>{value}</span>
    </div>
  );
}
