"use client";

import { JsonViewer } from "./JsonViewer";
import { cn } from "@/lib/utils/cn";

interface AnalyticsFinding {
  id: string;
  type: string;
  metricType: string | null;
  title: string;
  description: string;
  direction: string | null;
  magnitude: number | null;
  confidence: number;
  periodsCovered: number;
  supportingValues: Array<{ period: string; value: number }>;
  detectedAt: string;
}

interface AnalyticsSnapshot {
  userId: string;
  analysisWindow: { start: string; end: string };
  findings: AnalyticsFinding[];
  failures: Array<{ analyzerName: string; errorMessage: string }>;
  metadata: {
    analyzersRun: number;
    analyzersSkipped: number;
    analyzerFailures: number;
    totalFindings: number;
    snapshotsAnalyzed: number;
  };
}

interface Props { snapshot: AnalyticsSnapshot; showRaw?: boolean }

const DIRECTION_COLOR: Record<string, string> = {
  IMPROVING:         "text-income",
  DECLINING:         "text-expense",
  STABLE:            "text-accent",
  VOLATILE:          "text-warning",
  INSUFFICIENT_DATA: "text-ink-faint",
};

const FINDING_TYPE_COLOR: Record<string, string> = {
  TREND:      "bg-accent/15 text-accent",
  VARIANCE:   "bg-warning/15 text-warning",
  SEASONALITY:"bg-purple-400/15 text-purple-400",
  RISK:       "bg-expense/15 text-expense",
  BEHAVIOUR:  "bg-blue-400/15 text-blue-400",
  GOAL_PROGRESS: "bg-income/15 text-income",
};

export function AnalyticsViewer({ snapshot, showRaw }: Props) {
  if (showRaw) return <JsonViewer data={snapshot} defaultExpanded />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 flex-wrap">
        <Stat label="Snapshots analyzed" value={String(snapshot.metadata.snapshotsAnalyzed)} />
        <Stat label="Analyzers run" value={String(snapshot.metadata.analyzersRun)} />
        <Stat label="Analyzers skipped" value={String(snapshot.metadata.analyzersSkipped)} warn={snapshot.metadata.analyzersSkipped > 0} />
        <Stat label="Findings" value={String(snapshot.metadata.totalFindings)} />
      </div>

      {snapshot.metadata.analyzersSkipped > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
          <div className="text-xs font-mono text-warning">
            ⚠ {snapshot.metadata.analyzersSkipped} analyzers skipped — insufficient historical snapshots.
            Analytics depth improves as monthly data accumulates.
          </div>
        </div>
      )}

      {/* Findings */}
      {snapshot.findings.length === 0 ? (
        <div className="text-xs font-mono text-ink-faint text-center py-8">
          No findings — insufficient data for pattern detection.
        </div>
      ) : (
        <div className="space-y-3">
          {snapshot.findings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}

      {/* Failures */}
      {snapshot.failures.length > 0 && (
        <div className="rounded-xl border border-expense/30 bg-expense/5 p-4">
          <div className="text-xs font-mono text-expense mb-2 uppercase tracking-wider">Analyzer Failures</div>
          {snapshot.failures.map((f, i) => (
            <div key={i} className="text-xs font-mono text-ink-muted">
              <span className="text-expense">{f.analyzerName}</span>: {f.errorMessage}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding }: { finding: AnalyticsFinding }) {
  const typeClasses = FINDING_TYPE_COLOR[finding.type] ?? "bg-white/10 text-ink-muted";
  const dirColor = finding.direction ? (DIRECTION_COLOR[finding.direction] ?? "text-ink") : "";

  return (
    <div className="rounded-xl border border-white/10 bg-surface-1 p-4 space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full", typeClasses)}>
          {finding.type}
        </span>
        {finding.metricType && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/8 text-ink-muted">
            {finding.metricType.replace(/_/g, " ")}
          </span>
        )}
        {finding.direction && (
          <span className={cn("text-[10px] font-mono font-bold", dirColor)}>
            {finding.direction}
          </span>
        )}
      </div>
      <div className="text-sm font-medium text-ink">{finding.title}</div>
      <div className="text-xs text-ink-muted leading-relaxed">{finding.description}</div>
      <div className="flex gap-4 text-xs font-mono">
        <span className="text-ink-faint">confidence {(finding.confidence * 100).toFixed(0)}%</span>
        <span className="text-ink-faint">{finding.periodsCovered} period{finding.periodsCovered !== 1 ? "s" : ""}</span>
        {finding.magnitude !== null && (
          <span className={finding.magnitude >= 0 ? "text-income" : "text-expense"}>
            {finding.magnitude >= 0 ? "+" : ""}{(finding.magnitude * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-[10px] font-mono text-ink-faint">id: {finding.id}</div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-xs font-mono">
      <span className="text-ink-faint">{label}: </span>
      <span className={warn && value !== "0" ? "text-warning" : "text-ink"}>{value}</span>
    </div>
  );
}
