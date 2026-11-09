"use client";

import { cn } from "@/lib/utils/cn";

interface PipelineMetadata {
  userId: string;
  ranAt: string;
  durationMs: number;
  historicalSnapshotCount: number;
  analyticsAnalyzersSkipped: number;
}

interface PipelineData {
  metadata: PipelineMetadata;
  metricsSnapshot: { failures: Array<{ type: string; errorMessage: string }>; metadata: { totalAttempted: number; successfulMetrics: number } };
  analyticsSnapshot: {
    metadata: { analyzersRun: number; analyzersSkipped: number; analyzerFailures: number };
    failures: Array<{ analyzerName: string; errorMessage: string }>;
  };
  insightSnapshot: {
    metadata: { generatorsRun: number; generatorFailures: number };
    failures: Array<{ generatorId: string; errorMessage: string }>;
  };
  recommendationSnapshot: {
    metadata: { generatorsRun: number; generatorFailures: number };
    failures: Array<{ generatorName: string; errorMessage: string }>;
  };
}

interface Props { data: PipelineData }

// Known calibration findings from CALIBRATION_NOTES.md
const KNOWN_ASSUMPTIONS = [
  {
    id: "CF-001",
    status: "PENDING",
    title: "No Investment model in Prisma schema",
    detail: "PrismaInvestmentRepository always returns []. Net worth = −total_debt.",
    severity: "medium",
  },
  {
    id: "CF-002",
    status: "ACCEPTED",
    title: "First-run analytics degradation",
    detail: "Analyzers requiring ≥2 snapshots skipped on first run. Analytics depth improves as data accumulates.",
    severity: "low",
  },
  {
    id: "CF-003",
    status: "ACCEPTED",
    title: "Nullable debt fields use safe defaults",
    detail: "interestRate→0, lender→Unknown, emiAmount→0, startDate→createdAt.",
    severity: "low",
  },
  {
    id: "CF-004",
    status: "ACCEPTED",
    title: "Goal domain fields derived from DB state",
    detail: "status, priority, contributionFrequency derived from isActive, isPrimary, and progress ratio.",
    severity: "low",
  },
  {
    id: "CF-005",
    status: "ACCEPTED",
    title: "GoalType mapping gaps",
    detail: "SAVINGS_RESERVE and INVESTMENT map to GoalType.CUSTOM.",
    severity: "low",
  },
  {
    id: "CF-006",
    status: "ACCEPTED",
    title: "SubscriptionFreq.YEARLY → Frequency.ANNUALLY",
    detail: "Naming difference only, no data loss.",
    severity: "none",
  },
  {
    id: "CF-007",
    status: "MONITOR",
    title: "Mandate amount fallback to mandateLimit",
    detail: "When Mandate.amount is null, mandateLimit is used — may overstate recurring spend.",
    severity: "low",
  },
  {
    id: "CF-008",
    status: "ACCEPTED",
    title: "Budget AggregatePeriod construction",
    detail: "Period range computed from startDate + period type. Anchored to budget creation date.",
    severity: "low",
  },
] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING:  "bg-warning/15 text-warning",
  ACCEPTED: "bg-income/10 text-income",
  MONITOR:  "bg-accent/10 text-accent",
};

const SEVERITY_COLOR: Record<string, string> = {
  medium: "border-l-warning/60",
  low:    "border-l-white/20",
  none:   "border-l-white/10",
};

export function CalibrationPanel({ data }: Props) {
  const m = data.metadata;
  const totalFailures =
    data.metricsSnapshot.failures.length +
    data.analyticsSnapshot.failures.length +
    data.insightSnapshot.failures.length +
    data.recommendationSnapshot.failures.length;

  return (
    <div className="space-y-6">
      {/* Performance */}
      <section className="space-y-3">
        <SectionHeader label="Pipeline Execution" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PerfCard label="Duration" value={`${m.durationMs}ms`} />
          <PerfCard label="Ran at" value={fmtTime(m.ranAt)} />
          <PerfCard label="Historical snapshots" value={String(m.historicalSnapshotCount)}
            warn={m.historicalSnapshotCount === 1} />
          <PerfCard label="Analyzers skipped" value={String(m.analyticsAnalyzersSkipped)}
            warn={m.analyticsAnalyzersSkipped > 0} />
        </div>
        {m.historicalSnapshotCount === 1 && (
          <Alert color="warning">
            Cold start — only 1 historical snapshot available. Trend and analytics quality improves over time.
          </Alert>
        )}
      </section>

      {/* Layer failures */}
      {totalFailures > 0 && (
        <section className="space-y-3">
          <SectionHeader label="Layer Failures" red />
          <FailureBlock label="Metrics" items={data.metricsSnapshot.failures.map((f) => ({ key: f.type, msg: f.errorMessage }))} />
          <FailureBlock label="Analytics" items={data.analyticsSnapshot.failures.map((f) => ({ key: f.analyzerName, msg: f.errorMessage }))} />
          <FailureBlock label="Insights" items={data.insightSnapshot.failures.map((f) => ({ key: f.generatorId, msg: f.errorMessage }))} />
          <FailureBlock label="Recommendations" items={data.recommendationSnapshot.failures.map((f) => ({ key: f.generatorName, msg: f.errorMessage }))} />
        </section>
      )}

      {/* Layer coverage */}
      <section className="space-y-3">
        <SectionHeader label="Layer Coverage" />
        <div className="space-y-2 font-mono text-xs">
          <CoverageRow label="Metrics" run={data.metricsSnapshot.metadata.successfulMetrics} total={data.metricsSnapshot.metadata.totalAttempted} />
          <CoverageRow label="Analytics analyzers" run={data.analyticsSnapshot.metadata.analyzersRun} skip={data.analyticsSnapshot.metadata.analyzersSkipped} fail={data.analyticsSnapshot.metadata.analyzerFailures} />
          <CoverageRow label="Insight generators" run={data.insightSnapshot.metadata.generatorsRun} fail={data.insightSnapshot.metadata.generatorFailures} />
          <CoverageRow label="Recommendation generators" run={data.recommendationSnapshot.metadata.generatorsRun} fail={data.recommendationSnapshot.metadata.generatorFailures} />
        </div>
      </section>

      {/* Known assumptions */}
      <section className="space-y-3">
        <SectionHeader label="Known Assumptions (CALIBRATION_NOTES.md)" />
        <div className="space-y-2">
          {KNOWN_ASSUMPTIONS.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-lg border border-white/10 border-l-4 px-4 py-3 space-y-1",
                SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.low,
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-ink-faint">{a.id}</span>
                <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full", STATUS_STYLE[a.status])}>
                  {a.status}
                </span>
                <span className="text-xs font-medium text-ink">{a.title}</span>
              </div>
              <div className="text-xs text-ink-faint">{a.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ label, red }: { label: string; red?: boolean }) {
  return (
    <div className={cn("text-xs font-mono font-bold uppercase tracking-wider", red ? "text-expense" : "text-ink-faint")}>
      {label}
    </div>
  );
}

function PerfCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-surface-1 px-3 py-2.5">
      <div className="text-[10px] font-mono text-ink-faint mb-1">{label}</div>
      <div className={cn("text-sm font-mono font-bold", warn ? "text-warning" : "text-ink")}>{value}</div>
    </div>
  );
}

function Alert({ color, children }: { color: "warning" | "expense"; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-lg border px-3 py-2 text-xs font-mono",
      color === "warning" ? "border-warning/30 bg-warning/5 text-warning" : "border-expense/30 bg-expense/5 text-expense",
    )}>
      {children}
    </div>
  );
}

function FailureBlock({ label, items }: { label: string; items: Array<{ key: string; msg: string }> }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-expense/30 bg-expense/5 px-3 py-2.5 space-y-1">
      <div className="text-[10px] font-mono text-expense">{label}</div>
      {items.map((item) => (
        <div key={item.key} className="text-[10px] font-mono text-ink-muted">
          <span className="text-expense">{item.key}</span>: {item.msg}
        </div>
      ))}
    </div>
  );
}

function CoverageRow({ label, run, total, skip, fail }: {
  label: string;
  run: number;
  total?: number;
  skip?: number;
  fail?: number;
}) {
  return (
    <div className="flex gap-3 items-center">
      <span className="text-ink-faint w-44 shrink-0">{label}</span>
      <span className="text-income">✓ {run} run</span>
      {total !== undefined && <span className="text-ink-faint">/ {total}</span>}
      {skip !== undefined && skip > 0 && <span className="text-warning">⊘ {skip} skipped</span>}
      {fail !== undefined && fail > 0 && <span className="text-expense">✗ {fail} failed</span>}
    </div>
  );
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return iso; }
}
