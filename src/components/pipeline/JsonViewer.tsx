"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface JsonViewerProps {
  data: unknown;
  defaultExpanded?: boolean;
  depth?: number;
  label?: string;
  className?: string;
}

const MAX_INLINE_ARRAY = 4;
const MAX_AUTO_EXPAND_DEPTH = 2;

export function JsonViewer({ data, defaultExpanded, depth = 0, label, className }: JsonViewerProps) {
  const autoExpand = defaultExpanded ?? depth < MAX_AUTO_EXPAND_DEPTH;
  const [expanded, setExpanded] = useState(autoExpand);

  if (data === null) return <Leaf label={label} value="null" color="text-ink-faint" />;
  if (data === undefined) return <Leaf label={label} value="undefined" color="text-ink-faint" />;
  if (typeof data === "boolean") return <Leaf label={label} value={String(data)} color="text-accent" />;
  if (typeof data === "number") return <Leaf label={label} value={String(data)} color="text-income" />;
  if (typeof data === "string") {
    // ISO date string → show formatted
    const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data);
    if (isDate) return <Leaf label={label} value={`"${fmtDate(data)}"`} color="text-warning" />;
    const truncated = data.length > 120 ? data.slice(0, 120) + "…" : data;
    return <Leaf label={label} value={`"${truncated}"`} color="text-ink-muted" />;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <Leaf label={label} value="[]" color="text-ink-faint" />;
    return (
      <div className={cn("font-mono text-xs", className)}>
        <button
          className="flex items-center gap-1 text-left hover:text-ink transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {label && <span className="text-accent-light">{label}:{" "}</span>}
          <Chevron expanded={expanded} />
          <span className="text-ink-faint">
            [{data.length}]
          </span>
        </button>
        {expanded && (
          <div className="pl-4 border-l border-white/10 mt-0.5 space-y-0.5">
            {data.map((item, i) => (
              <JsonViewer key={i} data={item} depth={depth + 1} label={String(i)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <Leaf label={label} value="{}" color="text-ink-faint" />;
    return (
      <div className={cn("font-mono text-xs", className)}>
        <button
          className="flex items-center gap-1 text-left hover:text-ink transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {label && <span className="text-accent-light">{label}:{" "}</span>}
          <Chevron expanded={expanded} />
          <span className="text-ink-faint">
            {"{"}…{"}"} {entries.length} keys
          </span>
        </button>
        {expanded && (
          <div className="pl-4 border-l border-white/10 mt-0.5 space-y-0.5">
            {entries.map(([k, v]) => (
              <JsonViewer key={k} data={v} depth={depth + 1} label={k} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <Leaf label={label} value={String(data)} color="text-ink-muted" />;
}

function Leaf({ label, value, color }: { label?: string; value: string; color: string }) {
  return (
    <div className="flex gap-1.5 font-mono text-xs leading-5">
      {label && <span className="text-accent-light shrink-0">{label}:</span>}
      <span className={color}>{value}</span>
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <span className={cn("text-ink-faint inline-block transition-transform text-[10px]", expanded ? "rotate-90" : "")}>
      ▶
    </span>
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
