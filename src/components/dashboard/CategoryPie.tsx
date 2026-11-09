"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils/categories";
import type { CategoryBreakdown } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  breakdown: CategoryBreakdown[];
  total: number;
}

export function CategoryPie({ breakdown, total }: Props) {
  const top = breakdown.slice(0, 8);

  return (
    <div className="glass-card p-5 flex flex-col">
      <h2 className="text-sm font-semibold text-ink mb-4">Top Categories</h2>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={top}
            dataKey="amount"
            nameKey="displayName"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={0}
          >
            {top.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f0f22",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#e8e8ff",
              fontSize: "12px",
            }}
            formatter={(value: number) => [formatCurrency(value), ""]}
          />
          {/* Center label */}
          <text
            x="50%"
            y="43%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-ink"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            {formatCurrency(total)}
          </text>
          <text
            x="50%"
            y="57%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 10, fill: "#8884a8" }}
          >
            total
          </text>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-2 mt-3 flex-1 overflow-y-auto hide-scrollbar">
        {top.map((item) => (
          <div key={item.category} className="flex items-center gap-2.5">
            <span className="text-base leading-none">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink truncate">{item.displayName}</span>
                <span className="text-xs text-ink tabular-nums ml-2">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                {item.trend !== 0 && (
                  <div className={`flex items-center gap-0.5 text-[10px] ${
                    item.trend > 0 ? "text-expense" : "text-income"
                  }`}>
                    {item.trend > 0
                      ? <TrendingUp className="w-2.5 h-2.5" />
                      : <TrendingDown className="w-2.5 h-2.5" />
                    }
                    {Math.abs(item.trend)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
