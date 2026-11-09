"use client";

import { useState, useEffect } from "react";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryPie } from "@/components/dashboard/CategoryPie";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { formatCurrency } from "@/lib/utils/categories";
import { subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DashboardData } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const month = format(currentDate, "yyyy-MM");

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/analytics/summary?month=${month}`);
    const json = await res.json() as { success: boolean; data: DashboardData };
    if (json.success) setData(json.data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [month]);

  const prev = () => setCurrentDate((d) => subMonths(d, 1));
  const next = () => {
    const n = subMonths(new Date(), 0);
    if (currentDate < n) setCurrentDate((d) => subMonths(d, -1));
  };
  const isCurrentMonth = format(currentDate, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Analytics</h1>

        {/* Month picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-lg border border-glass-border bg-white/5 flex items-center
                       justify-center text-ink-muted hover:text-ink hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-ink min-w-28 text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={next}
            disabled={isCurrentMonth}
            className="w-8 h-8 rounded-lg border border-glass-border bg-white/5 flex items-center
                       justify-center text-ink-muted hover:text-ink hover:bg-white/10
                       disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <MetricsBar summary={data.summary} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
            <div className="xl:col-span-2">
              <SpendingChart trend={data.spendingTrend} />
            </div>
            <CategoryPie breakdown={data.categoryBreakdown} total={data.summary.totalExpenses} />
          </div>

          {/* Category bar chart */}
          <div className="glass-card p-5 mt-5">
            <h2 className="text-sm font-semibold text-ink mb-5">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.categoryBreakdown.slice(0, 10)}
                margin={{ top: 4, right: 0, left: -20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="displayName"
                  tick={{ fill: "#8884a8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis
                  tickFormatter={(v: number) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
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
                  formatter={(value: number) => [formatCurrency(value), "Spent"]}
                />
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  fill="#7c3aed"
                  fillOpacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Month over month summary */}
          <div className="glass-card p-5 mt-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Month Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Total transactions", value: String(data.summary.transactionCount) },
                { label: "Avg daily spend", value: formatCurrency(data.summary.burnRate) },
                { label: "Savings rate",
                  value: `${(data.summary.savingsRate * 100).toFixed(1)}%` },
              ].map((item) => (
                <div key={item.label} className="bg-white/3 rounded-xl p-3 border border-glass-border">
                  <p className="text-xs text-ink-muted">{item.label}</p>
                  <p className="text-lg font-semibold text-ink mt-1 tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
