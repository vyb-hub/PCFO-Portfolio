"use client";

import { cn } from "@/lib/utils/cn";

interface Props {
  progress: number;       // 0.0 – 1.0
  size?: number;          // px, default 160
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  glow?: boolean;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 12,
  color,
  trackColor = "rgba(255,255,255,0.06)",
  label,
  sublabel,
  glow = false,
  className,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className={cn("relative flex items-center justify-center", className)}
         style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s ease",
            filter: glow ? `drop-shadow(0 0 8px ${color})` : undefined,
          }}
        />
      </svg>

      {/* Center content */}
      {(label ?? sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          {label && (
            <span className="font-semibold text-ink tabular-nums leading-tight"
                  style={{ fontSize: size < 120 ? "13px" : "18px" }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-ink-muted mt-0.5"
                  style={{ fontSize: size < 120 ? "9px" : "11px" }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
