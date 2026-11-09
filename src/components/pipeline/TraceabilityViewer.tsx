"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface Recommendation { id: string; title: string; rationale: string; priority: string; category: string; action: string; supportingInsightIds: string[]; supportingFindingIds: string[]; supportingMetricTypes: string[] }
interface FinancialInsight { id: string; title: string; summary: string; severity: string; metric: string; type: string; confidence: number; supportingMetrics: string[] }
interface AnalyticsFinding { id: string; title: string; description: string; type: string; metricType: string | null; direction: string | null; confidence: number; magnitude: number | null }
interface MetricResult { type: string; value: number; unit: string; definition: { name: string } }
interface MetricEvaluation { result: MetricResult; isHealthy: boolean }

interface PipelineData {
  recommendationSnapshot: { recommendations: Recommendation[] };
  insightSnapshot: { insights: FinancialInsight[] };
  analyticsSnapshot: { findings: AnalyticsFinding[] };
  metricsSnapshot: { results: MetricResult[]; evaluations: MetricEvaluation[] };
}

interface Props { data: PipelineData }

const UNIT_FMT: Record<string, (v: number) => string> = {
  PERCENTAGE: (v) => `${(v * 100).toFixed(1)}%`,
  RATIO:      (v) => v.toFixed(3),
  CURRENCY:   (v) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
  MONTHS:     (v) => `${v.toFixed(1)} mo`,
  COUNT:      (v) => v.toFixed(0),
};

export function TraceabilityViewer({ data }: Props) {
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  const recs = data.recommendationSnapshot.recommendations;
  const insightMap = new Map(data.insightSnapshot.insights.map((i) => [i.id, i]));
  const findingMap = new Map(data.analyticsSnapshot.findings.map((f) => [f.id, f]));
  const metricMap = new Map(data.metricsSnapshot.results.map((r) => [r.type, r]));
  const evalMap   = new Map(data.metricsSnapshot.evaluations.map((e) => [e.result.type, e]));

  const selectedRec = selectedRecId ? recs.find((r) => r.id === selectedRecId) ?? null : null;
  const selectedInsight = selectedInsightId ? insightMap.get(selectedInsightId) ?? null : null;

  return (
    <div className="space-y-6">
      <div className="text-xs font-mono text-ink-faint">
        Select a recommendation to trace it back through insights → findings → metrics → aggregate.
      </div>

      {/* Step 1 — Pick a recommendation */}
      <TraceStep
        number={1}
        label="Recommendation"
        color="text-expense"
        active={true}
      >
        {recs.length === 0 ? (
          <div className="text-xs font-mono text-ink-faint">No recommendations.</div>
        ) : (
          <div className="space-y-2">
            {recs.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRecId(r.id); setSelectedInsightId(null); }}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2.5 transition-all text-xs",
                  r.id === selectedRecId
                    ? "border-accent/50 bg-accent/10 text-ink"
                    : "border-white/10 text-ink-muted hover:border-white/20 hover:text-ink",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <PriorityBadge priority={r.priority} />
                  <span className="font-mono text-[10px] text-ink-faint">{r.category}</span>
                </div>
                <div className="font-medium">{r.title}</div>
              </button>
            ))}
          </div>
        )}
      </TraceStep>

      {/* Step 2 — Supporting Insights */}
      {selectedRec && (
        <TraceStep number={2} label="Supporting Insights" color="text-warning" active>
          {selectedRec.supportingInsightIds.length === 0 ? (
            <div className="text-xs font-mono text-ink-faint">No supporting insights.</div>
          ) : (
            <div className="space-y-2">
              {selectedRec.supportingInsightIds.map((id) => {
                const insight = insightMap.get(id);
                if (!insight) return <MissingRef key={id} id={id} />;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedInsightId(id)}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2.5 transition-all text-xs",
                      id === selectedInsightId
                        ? "border-accent/50 bg-accent/10 text-ink"
                        : "border-white/10 text-ink-muted hover:border-white/20 hover:text-ink",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={insight.severity} />
                      <span className="font-mono text-[10px] text-ink-faint">{insight.metric.replace(/_/g, " ")}</span>
                      <span className="font-mono text-[10px] text-ink-faint ml-auto">{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="font-medium text-ink">{insight.title}</div>
                    <div className="text-ink-faint mt-0.5 leading-relaxed">{insight.summary}</div>
                  </button>
                );
              })}
            </div>
          )}
        </TraceStep>
      )}

      {/* Step 3 — Supporting Analytics Findings */}
      {selectedInsight && (
        <TraceStep number={3} label="Analytics Findings" color="text-accent" active>
          {selectedRec?.supportingFindingIds && selectedRec.supportingFindingIds.length > 0 ? (
            <div className="space-y-2">
              {selectedRec.supportingFindingIds.map((id) => {
                const finding = findingMap.get(id);
                if (!finding) return <MissingRef key={id} id={id} />;
                return (
                  <div key={id} className="rounded-lg border border-white/10 px-3 py-2.5 bg-surface-1 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">{finding.type}</span>
                      {finding.direction && (
                        <span className="font-mono text-[10px] text-ink-faint">{finding.direction}</span>
                      )}
                      <span className="font-mono text-[10px] text-ink-faint ml-auto">{(finding.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="font-medium text-ink">{finding.title}</div>
                    <div className="text-ink-faint mt-0.5">{finding.description}</div>
                    {finding.magnitude !== null && (
                      <div className={cn("font-mono text-[10px] mt-1", finding.magnitude >= 0 ? "text-income" : "text-expense")}>
                        magnitude {finding.magnitude >= 0 ? "+" : ""}{(finding.magnitude * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs font-mono text-ink-faint">No analytics findings linked.</div>
          )}
        </TraceStep>
      )}

      {/* Step 4 — Supporting Metrics */}
      {(selectedRec || selectedInsight) && (
        <TraceStep number={4} label="Supporting Metrics" color="text-income" active>
          {(() => {
            const metricTypes = [
              ...(selectedRec?.supportingMetricTypes ?? []),
              ...(selectedInsight?.supportingMetrics ?? []),
              ...(selectedInsight ? [selectedInsight.metric] : []),
            ];
            const uniqueTypes = [...new Set(metricTypes)];
            if (uniqueTypes.length === 0) return (
              <div className="text-xs font-mono text-ink-faint">No metrics linked.</div>
            );
            return (
              <div className="space-y-2">
                {uniqueTypes.map((type) => {
                  const metric = metricMap.get(type);
                  const ev = evalMap.get(type);
                  if (!metric) return <MissingRef key={type} id={type} />;
                  const fmt = UNIT_FMT[metric.unit] ?? ((v: number) => v.toFixed(2));
                  return (
                    <div key={type} className={cn(
                      "rounded-lg border px-3 py-2.5 text-xs font-mono",
                      ev?.isHealthy === false ? "border-expense/40 bg-expense/5" : "border-white/10 bg-surface-1",
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="text-ink-faint">{type.replace(/_/g, " ")}</span>
                        <span className="text-ink font-bold ml-auto">{fmt(metric.value)}</span>
                        {ev && (
                          <span className={cn("text-[10px] font-bold", ev.isHealthy ? "text-income" : "text-expense")}>
                            {ev.isHealthy ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </TraceStep>
      )}
    </div>
  );
}

function TraceStep({ number, label, color, active, children }: {
  number: number;
  label: string;
  color: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-3 transition-opacity", !active && "opacity-40 pointer-events-none")}>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-mono font-bold w-5 h-5 rounded-full border flex items-center justify-center shrink-0", color, `border-current`)}>
          {number}
        </span>
        <span className={cn("text-xs font-mono font-bold", color)}>{label}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      {children}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-expense/20 text-expense",
    HIGH:     "bg-warning/20 text-warning",
    MEDIUM:   "bg-accent/15 text-accent",
    LOW:      "bg-white/8 text-ink-muted",
  };
  return (
    <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full", styles[priority] ?? styles.LOW)}>
      {priority}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-expense/20 text-expense",
    HIGH:     "bg-warning/20 text-warning",
    MEDIUM:   "bg-accent/15 text-accent",
    LOW:      "bg-white/8 text-ink-muted",
  };
  return (
    <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full", styles[severity] ?? styles.LOW)}>
      {severity}
    </span>
  );
}

function MissingRef({ id }: { id: string }) {
  return (
    <div className="rounded-lg border border-expense/20 px-3 py-2 text-[10px] font-mono text-expense">
      ⚠ ref not found: {id}
    </div>
  );
}
