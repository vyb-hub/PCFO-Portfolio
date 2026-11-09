"use client";

import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/categories";
import type { ViceSummary } from "@/lib/vice/analytics";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_GROUPS = [
  { label: "Morning", hours: [6, 7, 8, 9, 10, 11], range: "6–11 AM" },
  { label: "Afternoon", hours: [12, 13, 14, 15, 16, 17], range: "12–5 PM" },
  { label: "Evening", hours: [18, 19, 20, 21], range: "6–9 PM" },
  { label: "Night", hours: [22, 23, 0, 1, 2, 3, 4, 5], range: "10 PM–5 AM" },
];

interface Props {
  summary: ViceSummary;
  accentColor: string;
}

export function HabitHeatmap({ summary, accentColor }: Props) {
  const maxDayAmount = Math.max(...summary.byDayOfWeek);

  // Group hourly data
  const hourGroupTotals = HOUR_GROUPS.map((g) => ({
    ...g,
    total: g.hours.reduce((s, h) => s + (summary.byHour[h] ?? 0), 0),
  }));
  const maxHourGroup = Math.max(...hourGroupTotals.map((g) => g.total));

  return (
    <div className="space-y-5">
      {/* Day-of-week heatmap */}
      <div>
        <p className="text-xs font-medium text-ink-muted mb-3">Day of Week</p>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => {
            const amount = summary.byDayOfWeek[i] ?? 0;
            const intensity = maxDayAmount > 0 ? amount / maxDayAmount : 0;
            const isWeekend = i === 0 || i === 6;

            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-lg transition-all"
                  style={{
                    height: "52px",
                    background:
                      amount > 0
                        ? `rgba(${hexToRgb(accentColor)}, ${0.12 + intensity * 0.75})`
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(${hexToRgb(accentColor)}, ${0.1 + intensity * 0.3})`,
                    boxShadow: intensity > 0.6
                      ? `0 0 12px rgba(${hexToRgb(accentColor)}, 0.3)`
                      : "none",
                  }}
                  title={`${label}: ${formatCurrency(amount)}`}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isWeekend ? "text-ink" : "text-ink-muted"
                  )}
                >
                  {label}
                </span>
                {amount > 0 && (
                  <span className="text-[9px] text-ink-faint tabular-nums">
                    {formatCurrency(amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time-of-day heatmap */}
      <div>
        <p className="text-xs font-medium text-ink-muted mb-3">Time of Day</p>
        <div className="space-y-1.5">
          {hourGroupTotals.map((group) => {
            const intensity = maxHourGroup > 0 ? group.total / maxHourGroup : 0;
            return (
              <div key={group.label} className="flex items-center gap-3">
                <span className="text-[10px] text-ink-muted w-20 flex-shrink-0">
                  {group.range}
                </span>
                <div className="flex-1 h-5 rounded-md overflow-hidden bg-white/3">
                  <div
                    className="h-full rounded-md transition-all"
                    style={{
                      width: `${intensity * 100}%`,
                      background: `rgba(${hexToRgb(accentColor)}, ${0.3 + intensity * 0.6})`,
                      boxShadow: group.label === "Night" && intensity > 0.3
                        ? `0 0 8px rgba(${hexToRgb(accentColor)}, 0.4)`
                        : "none",
                    }}
                  />
                </div>
                <span className="text-[10px] text-ink-muted w-16 text-right flex-shrink-0 tabular-nums">
                  {group.total > 0 ? formatCurrency(group.total) : "—"}
                </span>
                {group.label === "Night" && intensity > 0.3 && (
                  <span className="text-[9px] text-ink-faint">↑ late</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <StatPill
          label="Weekend"
          value={formatCurrency(summary.weekendTotal)}
          color={accentColor}
          highlight={summary.weekendRatio > 0.5}
        />
        <StatPill
          label="Late Night"
          value={formatCurrency(summary.lateNightTotal)}
          color={accentColor}
          highlight={summary.lateNightTotal > summary.currentMonth * 0.3}
        />
        <StatPill
          label="Post Salary"
          value={formatCurrency(summary.postSalaryTotal)}
          color={accentColor}
          highlight={summary.postSalaryTotal > summary.currentMonth * 0.3}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight: boolean;
}) {
  return (
    <div
      className="rounded-xl p-2.5 text-center"
      style={{
        background: highlight
          ? `rgba(${hexToRgb(color)}, 0.12)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid rgba(${hexToRgb(color)}, ${highlight ? 0.25 : 0.08})`,
      }}
    >
      <p className="text-[9px] font-medium uppercase tracking-wide"
         style={{ color: highlight ? color : "#8884a8" }}>
        {label}
      </p>
      <p className="text-xs font-semibold text-ink tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
