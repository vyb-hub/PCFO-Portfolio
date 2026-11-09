"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatCurrency, CATEGORY_META } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { TransactionDTO, PaginatedResponse } from "@/types";

const CATEGORIES = Object.entries(CATEGORY_META).map(([k, v]) => ({
  value: k,
  label: v.name,
  icon: v.icon,
}));

export default function TransactionsPage() {
  const [data, setData] = useState<PaginatedResponse<TransactionDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"" | "DEBIT" | "CREDIT">("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "25",
      ...(search && { search }),
      ...(category && { category }),
      ...(type && { type }),
    });

    const res = await fetch(`/api/transactions?${params}`);
    const json = await res.json() as { success: boolean; data: PaginatedResponse<TransactionDTO> };
    if (json.success) setData(json.data);
    setLoading(false);
  }, [page, search, category, type]);

  useEffect(() => { void load(); }, [load]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search, category, type]);

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Transactions</h1>
        {data && (
          <p className="text-sm text-ink-muted">{data.total.toLocaleString()} total</p>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-glass-border
                       text-ink text-sm placeholder:text-ink-faint focus:outline-none
                       focus:border-accent/40 transition-colors"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-glass-border text-sm text-ink
                     focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {(["", "DEBIT", "CREDIT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                type === t
                  ? t === "DEBIT"
                    ? "bg-expense-muted border-expense-border text-expense"
                    : t === "CREDIT"
                    ? "bg-income-muted border-income-border text-income"
                    : "bg-accent-muted border-accent-border text-accent-light"
                  : "bg-white/5 border-glass-border text-ink-muted hover:text-ink"
              )}
            >
              {t === "" ? "All" : t === "DEBIT" ? "Debits" : "Credits"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 skeleton rounded-xl" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="flex items-center justify-center py-16 text-ink-muted text-sm">
            No transactions found.
          </div>
        ) : (
          <>
            <div className="divide-y divide-glass-border">
              {data.items.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: `${tx.categoryColor}18` }}
                  >
                    {tx.categoryIcon}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink font-medium truncate">
                      {tx.merchant ?? tx.description}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {tx.categoryDisplay}
                      {tx.accountLast4 && ` · ••${tx.accountLast4}`}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="text-right hidden md:block flex-shrink-0">
                    <p className="text-xs text-ink-muted">
                      {format(parseISO(tx.date), "dd MMM yyyy")}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {format(parseISO(tx.date), "HH:mm")}
                    </p>
                  </div>

                  {/* Type badge */}
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 hidden sm:flex",
                    tx.type === "DEBIT"
                      ? "bg-expense-muted text-expense"
                      : "bg-income-muted text-income"
                  )}>
                    {tx.type === "DEBIT"
                      ? <ArrowDownRight className="w-3 h-3" />
                      : <ArrowUpRight className="w-3 h-3" />
                    }
                    {tx.type}
                  </div>

                  {/* Amount */}
                  <p className={cn(
                    "text-sm font-semibold tabular-nums flex-shrink-0 text-right",
                    tx.type === "DEBIT" ? "text-expense" : "text-income"
                  )}>
                    {tx.type === "DEBIT" ? "−" : "+"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-glass-border">
              <p className="text-xs text-ink-muted">
                Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs border border-glass-border text-ink-muted
                             hover:text-ink hover:bg-white/5 disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasMore}
                  className="px-3 py-1.5 rounded-lg text-xs border border-glass-border text-ink-muted
                             hover:text-ink hover:bg-white/5 disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
