"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { SpendingTrend } from "@/types";

interface Props {
  trend: SpendingTrend[];
}

const formatINR = (val: number) =>
  val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`;

export function SpendingChart({ trend }: Props) {
  const formatted = trend.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "dd MMM"),
  }));

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-ink">Cash Flow</h2>
        <div className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-income inline-block" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-expense inline-block" />
            Expenses
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={formatted} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: "#8884a8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatINR}
            tick={{ fill: "#8884a8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f0f22",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#e8e8ff",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [
              `₹${value.toLocaleString("en-IN")}`,
              name === "income" ? "Income" : "Expenses",
            ]}
            labelStyle={{ color: "#8884a8", marginBottom: "4px" }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#incomeGrad)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#expenseGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
