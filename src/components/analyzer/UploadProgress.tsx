"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ImportStreamEvent, StageEvent, ImportStage, FileImportReport } from "@/lib/analyzer/importTypes";

interface FileTrack {
  fileName: string;
  stageOrder: ImportStage[];
  stagesById: Partial<Record<ImportStage, StageEvent>>;
}

interface ClosingMatch {
  monthId: string;
  itemId: string;
  label: string;
}

type ClosingActionState = "idle" | "confirming" | "confirmed" | "dismissed";

interface UploadProgressProps {
  uploadPercent: number | null;
  phase: "uploading" | "processing" | "done";
  events: ImportStreamEvent[];
  onRetry: (fileName: string) => void;
  refreshDashboard: () => Promise<void>;
}

export function UploadProgress({ uploadPercent, phase, events, onRetry, refreshDashboard }: UploadProgressProps) {
  const [refreshState, setRefreshState] = useState<"pending" | "running" | "done">("pending");
  const [closingAction, setClosingAction] = useState<Record<string, ClosingActionState>>({});

  const files = useMemo(() => {
    const map = new Map<string, FileTrack>();
    for (const event of events) {
      if (event.type !== "stage") continue;
      let track = map.get(event.file);
      if (!track) {
        track = { fileName: event.file, stageOrder: [], stagesById: {} };
        map.set(event.file, track);
      }
      if (!track.stageOrder.includes(event.stage)) track.stageOrder.push(event.stage);
      track.stagesById[event.stage] = event;
    }
    return [...map.values()];
  }, [events]);

  const completeEvent = events.find((e) => e.type === "complete");

  useEffect(() => {
    if (!completeEvent || refreshState !== "pending") return;
    setRefreshState("running");
    void refreshDashboard().then(() => setRefreshState("done"));
    // refreshDashboard identity is stable from the parent (useCallback) — only re-run when completeEvent first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeEvent]);

  const confirmClosingMatch = async (fileName: string, match: ClosingMatch, statementId: string) => {
    setClosingAction((prev) => ({ ...prev, [fileName]: "confirming" }));
    try {
      const res = await fetch(`/api/financial-months/${match.monthId}/checklist/${match.itemId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementUploadId: statementId }),
      });
      const data = (await res.json()) as { success: boolean };
      setClosingAction((prev) => ({ ...prev, [fileName]: data.success ? "confirmed" : "idle" }));
    } catch {
      setClosingAction((prev) => ({ ...prev, [fileName]: "idle" }));
    }
  };

  if (phase === "uploading") {
    return (
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-ink">Uploading…</p>
          <p className="text-xs text-ink-muted tabular-nums">{uploadPercent ?? 0}%</p>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-accent-light transition-all duration-150"
            style={{ width: `${uploadPercent ?? 0}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 mb-4 space-y-5">
      {files.map((file) => {
        const report = completeEvent?.type === "complete" ? completeEvent.results.find((r) => r.file === file.fileName) : undefined;
        if (phase === "done" && report) {
          return (
            <FileSummary
              key={file.fileName}
              file={file}
              report={report}
              closingAction={closingAction[file.fileName] ?? "idle"}
              onConfirmClosingMatch={confirmClosingMatch}
              onDismissClosingMatch={(fileName) => setClosingAction((prev) => ({ ...prev, [fileName]: "dismissed" }))}
              onRetry={onRetry}
              refreshState={refreshState}
            />
          );
        }
        return (
          <div key={file.fileName}>
            <p className="text-xs text-ink-muted mb-2 truncate">{file.fileName}</p>
            <ul className="space-y-1.5">
              {file.stageOrder.map((stageId) => (
                <StageRow key={stageId} event={file.stagesById[stageId]!} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function StageRow({ event }: { event: StageEvent }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {event.status === "done" && <CheckCircle2 className="w-4 h-4 text-income flex-shrink-0" />}
      {event.status === "running" && <Loader2 className="w-4 h-4 text-accent-light animate-spin flex-shrink-0" />}
      {event.status === "error" && <XCircle className="w-4 h-4 text-expense flex-shrink-0" />}
      <span className={cn("text-ink", event.status === "running" && "text-accent-light")}>{event.title}</span>
      {event.status !== "error" && event.data && <StageData data={event.data} />}
      {event.status === "error" && event.diagnostic && (
        <span className="ml-auto text-xs text-expense truncate">{event.diagnostic.message}</span>
      )}
    </li>
  );
}

function StageData({ data }: { data: Record<string, unknown> }) {
  const parts: string[] = [];
  if (typeof data.bank === "string" && data.bank) parts.push(data.bank);
  if (data.encrypted === true) parts.push("encrypted");
  if (data.encrypted === false) parts.push("not encrypted");
  if (data.auto === true) parts.push("password derived automatically");
  if (typeof data.transactionCount === "number") parts.push(`${data.transactionCount} transactions`);
  if (typeof data.insightCount === "number") parts.push(`${data.insightCount} insights`);
  if (!parts.length) return null;
  return <span className="ml-auto text-xs text-ink-muted truncate">{parts.join(" · ")}</span>;
}

function FileSummary({
  file,
  report,
  closingAction,
  onConfirmClosingMatch,
  onDismissClosingMatch,
  onRetry,
  refreshState,
}: {
  file: FileTrack;
  report: FileImportReport;
  closingAction: ClosingActionState;
  onConfirmClosingMatch: (fileName: string, match: ClosingMatch, statementId: string) => void;
  onDismissClosingMatch: (fileName: string) => void;
  onRetry: (fileName: string) => void;
  refreshState: "pending" | "running" | "done";
}) {
  if (!report.success) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-1">
          <XCircle className="w-4 h-4 text-expense flex-shrink-0" />
          <span className="text-ink truncate">{file.fileName}</span>
        </div>
        <p className="text-xs text-expense mb-2">{report.diagnostic?.message ?? "Import failed"}</p>
        {report.diagnostic?.recoverable !== false && (
          <button
            onClick={() => onRetry(file.fileName)}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent text-void font-semibold hover:bg-accent-light transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const insightCount = file.stagesById["financial-intelligence"]?.data?.insightCount as number | undefined;
  const match = file.stagesById["closing-match"]?.data?.match as ClosingMatch | null | undefined;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-income mb-2">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        Statement imported successfully
      </div>
      <ul className="text-xs text-ink-muted space-y-1 ml-6 list-disc">
        <li>{report.transactionsCreated ?? 0} transactions extracted</li>
        {insightCount != null && <li>{insightCount} insights available</li>}
        {insightCount != null && <li>Financial Review updated</li>}
        {refreshState === "done" && <li>Dashboard refreshed</li>}
      </ul>
      {match && closingAction !== "confirmed" && closingAction !== "dismissed" && (
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-ink-muted">
            Suggested: link to <span className="text-ink font-medium">{match.label}</span> in this month&rsquo;s closing?
          </span>
          <button
            onClick={() => onConfirmClosingMatch(file.fileName, match, report.statementId ?? "")}
            disabled={closingAction === "confirming"}
            className="px-2.5 py-1 rounded-lg bg-accent text-void font-semibold hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {closingAction === "confirming" ? "Linking…" : "Confirm"}
          </button>
          <button
            onClick={() => onDismissClosingMatch(file.fileName)}
            className="px-2.5 py-1 rounded-lg text-ink-muted hover:text-ink transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
      {match && closingAction === "confirmed" && (
        <p className="mt-2 text-xs text-income">✓ Linked to {match.label}</p>
      )}
    </div>
  );
}
