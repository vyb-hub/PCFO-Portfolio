"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface Props {
  dailyTotals: { date: string; amount: number }[];
  accentColor: string;
  label: string;
}

export function ViceTrendChart({ dailyTotals, accentColor, label }: Props) {
  const hasData = dailyTotals.some((d) => d.amount > 0);
  const gradientId = `viceGrad-${label.replace(/\s/g, "")}`;

  const formatted = dailyTotals.map((d) => ({
    ...d,
    display: format(parseISO(d.date), "dd"),
  }));

  return (
    <div className="h-36">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="display"
              tick={{ fill: "#8884a8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
              }
              tick={{ fill: "#8884a8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f0f22",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                color: "#e8e8ff",
                fontSize: "11px",
              }}
              formatter={(value: number) => [
                `₹${value.toLocaleString("en-IN")}`,
                label,
              ]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={accentColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-ink-faint">
          No {label.toLowerCase()} spend detected this month.
        </div>
      )}
    </div>
  );
}
