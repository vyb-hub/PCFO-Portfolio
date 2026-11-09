"use client";

import { useEffect, useState } from "react";
import { Receipt, ChevronDown, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Local types (mirror pipeline output shape) ─────────────────
interface StoryBlock {
  title: string;
  category: string;
  blockType: string;
  priority: string;
  summary: string;
  explanation: string;
  userImpact: string;
  recommendedAction: string;
}
interface FinancialStory {
  category: string;
  blocks: StoryBlock[];
}

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: "border-expense/40 bg-expense/5  text-expense",
  HIGH:     "border-warning/40 bg-warning/5  text-warning",
  MEDIUM:   "border-accent/30  bg-accent/5   text-accent-light",
  LOW:      "border-white/10   bg-white/3    text-ink-muted",
};

// ─────────────────────────────────────────────────────────────
// Dashboard's rendering of a StoryBlock. All interpretation (title,
// summary, explanation, userImpact, recommendedAction, priority) is
// produced upstream by the Story Engine — this component only renders it.
export function LargestExpenseStoryCard() {
  const [block, setBlock]     = useState<StoryBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/finance/pipeline");
      const json = await res.json() as { success: boolean; data?: Record<string, unknown>; error?: string };
      if (!json.success || !json.data) { setError(json.error ?? "No data"); return; }

      const stories = ((json.data.storySnapshot as { stories?: FinancialStory[] } | undefined)?.stories) ?? [];
      const cashFlowStory = stories.find((s) => s.category === "CASH_FLOW");
      const largestExpenseBlock = cashFlowStory?.blocks.find((b) => b.blockType === "LARGEST_EXPENSE") ?? null;

      setBlock(largestExpenseBlock);
    } catch {
      setError("Could not load story");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <StorySkeleton />;
  if (error)   return <StoryError error={error} onRetry={load} />;
  if (!block)  return null;

  const priorityClass = PRIORITY_STYLE[block.priority] ?? PRIORITY_STYLE.MEDIUM!;

  return (
    <div className="glass-card p-5 space-y-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Receipt className="w-4 h-4 text-ink-muted flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{block.title}</p>
            <p className="text-xs text-ink-muted mt-0.5 leading-snug line-clamp-1">{block.summary}</p>
          </div>
        </div>
        <ChevronDown
          className={cn("w-4 h-4 text-ink-faint flex-shrink-0 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className={cn("rounded-xl border p-3 space-y-2 text-xs", priorityClass)}>
          <p className="leading-relaxed">{block.explanation}</p>
          <p className="leading-relaxed opacity-90"><span className="font-semibold">Should I care? </span>{block.userImpact}</p>
          <p className="leading-relaxed opacity-90"><span className="font-semibold">What to do: </span>{block.recommendedAction}</p>
        </div>
      )}
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-2">
      <div className="h-4 w-48 skeleton rounded" />
      <div className="h-3 w-64 skeleton rounded" />
    </div>
  );
}

function StoryError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="glass-card p-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-sm text-ink-muted">
        <AlertTriangle className="w-4 h-4 text-warning" />
        {error}
      </div>
      <button onClick={onRetry} className="text-xs text-accent-light hover:underline flex items-center gap-1">
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}
