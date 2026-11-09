"use client";

import { useState } from "react";
import { JsonViewer } from "./JsonViewer";
import { cn } from "@/lib/utils/cn";

interface FinancialReview {
  id: string;
  userId: string;
  period: { label: string; granularity: string };
  generatedAt: string;
  snapshotVersion: string;
  executiveSummary: {
    type: string;
    overallHealthScore: number;
    healthTier: string;
    criticalInsightCount: number;
    highInsightCount: number;
    criticalRecommendationCount: number;
    highRecommendationCount: number;
    topConcernInsightId: string | null;
    topAchievementInsightId: string | null;
    referencedInsightIds: string[];
    referencedRecommendationIds: string[];
    referencedMetricTypes: string[];
  };
  financialHealth: { type: string; entries: unknown[]; referencedMetricTypes: string[] };
  achievements: { type: string; totalAchievements: number; referencedInsightIds: string[] };
  risks: { type: string; riskInsightIds: string[]; warningInsightIds: string[]; criticalRecommendationIds: string[]; highRecommendationIds: string[] };
  goalProgress: { type: string; referencedInsightIds: string[]; referencedRecommendationIds: string[] };
  recommendations: { type: string; criticalIds: string[]; highIds: string[]; mediumIds: string[]; lowIds: string[]; referencedRecommendationIds: string[] };
  coachSummary: { type: string; primaryInsightIds: string[]; primaryRecommendationIds: string[]; keyMetricTypes: string[]; isPositivePeriod: boolean; healthTier: string; referencedInsightIds: string[]; referencedRecommendationIds: string[]; referencedMetricTypes: string[] };
  nextMonthFocus: { type: string; priorityActionIds: string[]; watchlistMetricTypes: string[]; activeRiskInsightIds: string[]; referencedInsightIds: string[]; referencedRecommendationIds: string[]; referencedMetricTypes: string[] };
  metadata: { sourceSnapshotIds: Record<string, string>; assembledAt: string };
}

const TIER_STYLE: Record<string, { ring: string; text: string; bg: string }> = {
  EXCELLENT:       { ring: "ring-income/40",   text: "text-income",   bg: "bg-income/10" },
  GOOD:            { ring: "ring-income/20",   text: "text-income",   bg: "bg-income/5" },
  FAIR:            { ring: "ring-accent/30",   text: "text-accent",   bg: "bg-accent/8" },
  NEEDS_ATTENTION: { ring: "ring-warning/40",  text: "text-warning",  bg: "bg-warning/8" },
  CRITICAL:        { ring: "ring-expense/50",  text: "text-expense",  bg: "bg-expense/10" },
};

const SECTIONS = [
  "Executive Summary",
  "Financial Health",
  "Achievements",
  "Risks",
  "Goal Progress",
  "Recommendations",
  "Coach Summary",
  "Next Month Focus",
] as const;

interface Props { review: FinancialReview; showRaw?: boolean }

export function ReviewViewer({ review, showRaw }: Props) {
  const [activeSection, setActiveSection] = useState<string>("Executive Summary");
  if (showRaw) return <JsonViewer data={review} defaultExpanded />;

  const tier = TIER_STYLE[review.executiveSummary.healthTier] ?? TIER_STYLE.FAIR!;
  const score = review.executiveSummary.overallHealthScore;

  return (
    <div className="space-y-4">
      {/* Health score hero */}
      <div className={cn("rounded-xl p-4 flex items-center gap-4 border ring-1", tier.bg, tier.ring)}>
        <div className="text-center">
          <div className={cn("text-4xl font-bold font-mono", tier.text)}>
            {(score * 100).toFixed(0)}
          </div>
          <div className="text-xs text-ink-faint">/ 100</div>
        </div>
        <div>
          <div className={cn("text-lg font-semibold", tier.text)}>{review.executiveSummary.healthTier.replace(/_/g, " ")}</div>
          <div className="text-xs text-ink-muted mt-0.5">{review.period.label}</div>
          <div className="text-xs font-mono text-ink-faint mt-1">
            {review.executiveSummary.criticalInsightCount} critical · {review.executiveSummary.highInsightCount} high insights ·{" "}
            {review.executiveSummary.criticalRecommendationCount} critical recs
          </div>
        </div>
        <div className="ml-auto text-[10px] font-mono text-ink-faint text-right">
          <div>id: {review.id}</div>
          <div>v{review.snapshotVersion}</div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={cn(
              "text-xs font-mono px-3 py-1.5 rounded-lg border transition-all",
              activeSection === s
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-white/10 text-ink-muted hover:border-white/20 hover:text-ink",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Section content */}
      <SectionContent section={activeSection} review={review} />
    </div>
  );
}

function SectionContent({ section, review }: { section: string; review: FinancialReview }) {
  switch (section) {
    case "Executive Summary":
      return <JsonViewer data={review.executiveSummary} defaultExpanded />;
    case "Financial Health":
      return (
        <div className="space-y-2">
          <div className="text-xs font-mono text-ink-faint mb-2">Referenced metrics: {review.financialHealth.referencedMetricTypes.join(", ") || "none"}</div>
          <JsonViewer data={review.financialHealth.entries} defaultExpanded />
        </div>
      );
    case "Achievements":
      return (
        <div className="space-y-2">
          <div className="text-xs font-mono text-ink-faint">Total achievements: {review.achievements.totalAchievements}</div>
          <IdList label="Insight IDs" ids={review.achievements.referencedInsightIds} />
        </div>
      );
    case "Risks":
      return (
        <div className="space-y-3">
          <IdList label="Risk Insights" ids={review.risks.riskInsightIds} color="text-expense" />
          <IdList label="Warning Insights" ids={review.risks.warningInsightIds} color="text-warning" />
          <IdList label="Critical Recommendations" ids={review.risks.criticalRecommendationIds} color="text-expense" />
          <IdList label="High Recommendations" ids={review.risks.highRecommendationIds} color="text-warning" />
        </div>
      );
    case "Goal Progress":
      return (
        <div className="space-y-3">
          <IdList label="Insight IDs" ids={review.goalProgress.referencedInsightIds} />
          <IdList label="Recommendation IDs" ids={review.goalProgress.referencedRecommendationIds} />
        </div>
      );
    case "Recommendations":
      return (
        <div className="space-y-2">
          <IdList label="Critical" ids={review.recommendations.criticalIds} color="text-expense" />
          <IdList label="High" ids={review.recommendations.highIds} color="text-warning" />
          <IdList label="Medium" ids={review.recommendations.mediumIds} />
          <IdList label="Low" ids={review.recommendations.lowIds} />
        </div>
      );
    case "Coach Summary":
      return (
        <div className="space-y-2 text-xs font-mono">
          <div className="flex gap-3">
            <span className="text-ink-faint">Period sentiment:</span>
            <span className={review.coachSummary.isPositivePeriod ? "text-income" : "text-expense"}>
              {review.coachSummary.isPositivePeriod ? "Positive" : "Needs attention"}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-ink-faint">Health tier:</span>
            <span>{review.coachSummary.healthTier}</span>
          </div>
          <IdList label="Top Insights for Coach" ids={review.coachSummary.primaryInsightIds} />
          <IdList label="Top Recommendations" ids={review.coachSummary.primaryRecommendationIds} />
          <IdList label="Key Metrics" ids={review.coachSummary.keyMetricTypes} color="text-accent" />
        </div>
      );
    case "Next Month Focus":
      return (
        <div className="space-y-2">
          <IdList label="Priority Actions" ids={review.nextMonthFocus.priorityActionIds} color="text-expense" />
          <IdList label="Watchlist Metrics" ids={review.nextMonthFocus.watchlistMetricTypes} color="text-accent" />
          <IdList label="Active Risk Insights" ids={review.nextMonthFocus.activeRiskInsightIds} color="text-warning" />
        </div>
      );
    default:
      return null;
  }
}

function IdList({ label, ids, color = "text-ink-muted" }: { label: string; ids: string[]; color?: string }) {
  if (ids.length === 0) return (
    <div className="text-xs font-mono text-ink-faint">{label}: (none)</div>
  );
  return (
    <div className="space-y-1">
      <div className="text-xs font-mono text-ink-faint">{label} ({ids.length}):</div>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <span key={id} className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5", color)}>
            {id}
          </span>
        ))}
      </div>
    </div>
  );
}
