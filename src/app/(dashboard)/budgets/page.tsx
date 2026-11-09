"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Target, Plus, ChevronLeft, ChevronRight, Edit3, Trash2,
  Check, X, RefreshCw, TrendingUp, AlertTriangle,
} from "lucide-react";
import { formatCurrency, CATEGORY_META } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import { format, addMonths, subMonths, parseISO } from "date-fns";

interface BudgetItem {
  id: string;
  category: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  currency: string;
  period: string;
  spent: number;
  remaining: number;
  pct: number;
  over: boolean;
  dailyBudget: number;
  daysLeft: number;
  startDate: string;
  endDate?: string;
}

interface BudgetsResponse {
  success: boolean;
  data: {
    items: BudgetItem[];
    month: string;
    totalBudget: number;
    totalSpent: number;
    overBudgetCount: number;
  };
}

const EXPENSE_CATS = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === "expense")
  .map(([k, v]) => ({ key: k, ...v }));

function barColor(pct: number, over: boolean): string {
  if (over) return "bg-expense";
  if (pct >= 85) return "bg-amber-400";
  return "bg-income";
}

function textColor(pct: number, over: boolean): string {
  if (over) return "text-expense";
  if (pct >= 85) return "text-amber-400";
  return "text-ink";
}

export default function BudgetsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [overCount, setOverCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState(EXPENSE_CATS[0]?.key ?? "food");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const monthParam = format(currentMonth, "yyyy-MM");

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${monthParam}`);
      const json = await res.json() as BudgetsResponse;
      if (json.success) {
        setItems(json.data.items);
        setTotalBudget(json.data.totalBudget);
        setTotalSpent(json.data.totalSpent);
        setOverCount(json.data.overBudgetCount);
      }
    } finally {
      setLoading(false);
    }
  }, [monthParam]);

  useEffect(() => { void fetchBudgets(); }, [fetchBudgets]);

  const handleEditSave = async (id: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    setSaving(true);
    await fetch("/api/budgets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount }),
    });
    setEditingId(null);
    setSaving(false);
    await fetchBudgets();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    await fetchBudgets();
  };

  const handleAdd = async () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0 || !newCat) return;
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: newCat,
        amount,
        currency: "INR",
        period: "MONTHLY",
        startDate: format(currentMonth, "yyyy-MM-01"),
      }),
    });
    setShowAdd(false);
    setNewAmount("");
    setSaving(false);
    await fetchBudgets();
  };

  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent-light" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Budgets</h1>
            <p className="text-xs text-ink-muted mt-0.5">Monthly spending limits by category</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchBudgets()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-glass-border text-ink-muted hover:text-ink
                       hover:bg-white/5 transition-all disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       border border-income/30 bg-income/10 text-income hover:bg-income/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between glass-card p-3">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 text-ink-muted hover:text-ink transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink">{format(currentMonth, "MMMM yyyy")}</p>
          {!loading && (
            <p className="text-[10px] text-ink-muted mt-0.5">
              {totalPct}% of budget used · {overCount > 0 && (
                <span className="text-expense">{overCount} over limit</span>
              )}
              {overCount === 0 && <span className="text-income">all within limits</span>}
            </p>
          )}
        </div>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 text-ink-muted hover:text-ink transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Total utilisation bar */}
      {!loading && totalBudget > 0 && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">Total budget utilisation</span>
            <span className={cn("font-semibold tabular-nums", textColor(totalPct, totalSpent > totalBudget))}>
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor(totalPct, totalSpent > totalBudget))}
              style={{ width: `${Math.min(100, totalPct)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Budgeted", value: formatCurrency(totalBudget) },
              { label: "Spent", value: formatCurrency(totalSpent) },
              { label: "Remaining", value: formatCurrency(Math.max(0, totalBudget - totalSpent)) },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[9px] text-ink-faint uppercase tracking-wider">{s.label}</p>
                <p className="text-xs font-semibold text-ink mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add budget form */}
      {showAdd && (
        <div className="glass-card p-4 border border-income/20 space-y-3">
          <p className="text-xs font-medium text-ink">New budget</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-ink-muted uppercase tracking-wider block mb-1">Category</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface/50 border border-glass-border
                           text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
              >
                {EXPENSE_CATS.map((c) => (
                  <option key={c.key} value={c.key}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-ink-muted uppercase tracking-wider block mb-1">Monthly limit (₹)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-lg bg-surface/50 border border-glass-border
                           text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent/40
                           placeholder:text-ink-faint"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowAdd(false); setNewAmount(""); }}
              className="px-3 py-1.5 rounded-lg text-xs text-ink-muted hover:text-ink
                         border border-glass-border hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleAdd()}
              disabled={saving || !newAmount}
              className="px-3 py-1.5 rounded-lg text-xs bg-income/20 text-income
                         border border-income/30 hover:bg-income/30 transition-all
                         disabled:opacity-40"
            >
              {saving ? "Saving…" : "Create budget"}
            </button>
          </div>
        </div>
      )}

      {/* Budget items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center border border-dashed border-glass-hover">
          <Target className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-sm text-ink-muted">No budgets set for {format(currentMonth, "MMMM")}.</p>
          <p className="text-xs text-ink-faint mt-1">Add a budget to track your spending by category.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs
                       bg-accent/10 border border-accent/20 text-accent-light hover:bg-accent/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add your first budget
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className={cn(
              "glass-card p-4",
              b.over && "border-expense/20"
            )}>
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${b.color}18` }}
                >
                  {b.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{b.name}</p>
                      {b.over && (
                        <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                         text-[9px] bg-expense/10 text-expense border border-expense/20">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Over
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingId === b.id ? (
                        <>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 px-2 py-1 rounded-lg bg-surface border border-accent/30
                                       text-ink text-xs text-right focus:outline-none focus:ring-1 focus:ring-accent/40"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleEditSave(b.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => void handleEditSave(b.id)}
                            disabled={saving}
                            className="p-1 rounded-lg text-income hover:bg-income/10 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded-lg text-ink-muted hover:bg-white/5 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <p className={cn("text-sm font-semibold tabular-nums", textColor(b.pct, b.over))}>
                            {formatCurrency(b.spent)}
                            <span className="text-ink-muted font-normal text-xs"> / {formatCurrency(b.amount)}</span>
                          </p>
                          <button
                            onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)); }}
                            className="p-1 rounded-lg text-ink-faint hover:text-ink hover:bg-white/5 transition-all"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => void handleDelete(b.id)}
                            disabled={deleting === b.id}
                            className="p-1 rounded-lg text-ink-faint hover:text-expense hover:bg-expense/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor(b.pct, b.over))}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between mt-1.5">
                    <p className={cn("text-[10px]", b.over ? "text-expense" : "text-ink-muted")}>
                      {b.over
                        ? `${formatCurrency(b.spent - b.amount)} over limit`
                        : `${formatCurrency(b.remaining)} remaining`}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-ink-faint">
                      {b.pct}%
                      {!b.over && b.daysLeft > 0 && b.dailyBudget > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5" />
                            {formatCurrency(b.dailyBudget)}/day · {b.daysLeft}d left
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
