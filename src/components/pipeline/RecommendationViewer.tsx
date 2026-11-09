"use client";

import { JsonViewer } from "./JsonViewer";
import { cn } from "@/lib/utils/cn";

interface Recommendation {
  id: string;
  category: string;
  priority: string;
  action: string;
  title: string;
  rationale: string;
  confidence: string;
  impacts: Array<{ description: string; metricType?: string; estimatedImprovement?: number }>;
  supportingInsightIds: string[];
  supportingFindingIds: string[];
  supportingMetricTypes: string[];
  generatedAt: string;
}

interface RecommendationSnapshot {
  userId: string;
  recommendations: Recommendation[];
  failures: Array<{ generatorName: string; errorMessage: string }>;
  metadata: {
    generatorsRun: number;
    generatorFailures: number;
    totalRecommendations: number;
    criticalRecommendations: number;
    highRecommendations: number;
    mediumRecommendations: number;
    lowRecommendations: number;
  };
}

interface Props {
  snapshot: RecommendationSnapshot;
  showRaw?: boolean;
  onSelectRecommendation?: (id: string) => void;
  highlightIds?: ReadonlyArray<string>;
}

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: "border-expense/50 bg-expense/8",
  HIGH:     "border-warning/40 bg-warning/5",
  MEDIUM:   "border-accent/25 bg-accent/5",
  LOW:      "border-white/10 bg-surface-1",
};

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-expense/20 text-expense",
  HIGH:     "bg-warning/20 text-warning",
  MEDIUM:   "bg-accent/15 text-accent",
  LOW:      "bg-white/8 text-ink-muted",
};

export function RecommendationViewer({ snapshot, showRaw, onSelectRecommendation, highlightIds }: Props) {
  if (showRaw) return <JsonViewer data={snapshot} defaultExpanded />;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Stat label="Total" value={String(snapshot.metadata.totalRecommendations)} />
        {snapshot.metadata.criticalRecommendations > 0 && (
          <Stat label="Critical" value={String(snapshot.metadata.criticalRecommendations)} red />
        )}
        {snapshot.metadata.highRecommendations > 0 && (
          <Stat label="High" value={String(snapshot.metadata.highRecommendations)} warn />
        )}
        <Stat label="Medium" value={String(snapshot.metadata.mediumRecommendations)} />
        <Stat label="Low" value={String(snapshot.metadata.lowRecommendations)} />
      </div>

      {snapshot.recommendations.length === 0 ? (
        <div className="text-xs font-mono text-ink-faint text-center py-8">
          No recommendations generated.
        </div>
      ) : (
        <div className="space-y-3">
          {snapshot.recommendations.map((rec) => {
            const highlighted = highlightIds?.includes(rec.id);
            return (
              <RecCard
                key={rec.id}
                rec={rec}
                highlighted={highlighted}
                onClick={onSelectRecommendation ? () => onSelectRecommendation(rec.id) : undefined}
              />
            );
          })}
        </div>
      )}

      {snapshot.failures.length > 0 && (
        <div className="rounded-xl border border-expense/30 bg-expense/5 p-4">
          <div className="text-xs font-mono text-expense mb-2">Generator Failures</div>
          {snapshot.failures.map((f, i) => (
            <div key={i} className="text-xs font-mono text-ink-muted">
              <span className="text-expense">{f.generatorName}</span>: {f.errorMessage}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecCard({
  rec,
  highlighted,
  onClick,
}: {
  rec: Recommendation;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const borderClass = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.LOW!;
  const badgeClass = PRIORITY_BADGE[rec.priority] ?? PRIORITY_BADGE.LOW!;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 transition-all",
        highlighted ? "ring-2 ring-accent/40 border-accent/50" : borderClass,
        onClick && "cursor-pointer hover:brightness-110",
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 flex-wrap">
        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full", badgeClass)}>
          {rec.priority}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/8 text-ink-muted">
          {rec.category}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/8 text-ink-muted">
          {rec.action.replace(/_/g, " ")}
        </span>
        <span className="text-[10px] font-mono text-ink-faint ml-auto">{rec.confidence}</span>
      </div>

      <div className="text-sm font-semibold text-ink">{rec.title}</div>
      <div className="text-xs text-ink-muted leading-relaxed">{rec.rationale}</div>

      {rec.impacts.length > 0 && (
        <div className="space-y-1">
          {rec.impacts.map((imp, i) => (
            <div key={i} className="text-xs text-ink-faint flex gap-2">
              <span className="text-income">→</span>
              <span>{imp.description}</span>
              {imp.estimatedImprovement != null && (
                <span className="text-income font-mono">+{(imp.estimatedImprovement * 100).toFixed(1)}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {rec.supportingMetricTypes.map((m) => (
          <span key={m} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent">
            {m.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {(rec.supportingInsightIds.length > 0 || rec.supportingFindingIds.length > 0) && (
        <div className="text-[10px] font-mono text-ink-faint space-y-0.5">
          {rec.supportingInsightIds.length > 0 && (
            <div>insights: {rec.supportingInsightIds.join(", ")}</div>
          )}
          {rec.supportingFindingIds.length > 0 && (
            <div>findings: {rec.supportingFindingIds.join(", ")}</div>
          )}
        </div>
      )}

      <div className="text-[10px] font-mono text-ink-faint">id: {rec.id}</div>
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
