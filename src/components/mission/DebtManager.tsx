"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { z } from "zod";

const DEBT_TYPES = [
  { value: "HOME_LOAN", label: "Home Loan" },
  { value: "CAR_LOAN", label: "Car Loan" },
  { value: "PERSONAL_LOAN", label: "Personal Loan" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "EDUCATION_LOAN", label: "Education Loan" },
  { value: "BNPL", label: "Buy Now Pay Later" },
  { value: "OTHER", label: "Other" },
] as const;

type DebtType = typeof DEBT_TYPES[number]["value"];

interface DebtRow {
  id: string;
  name: string;
  type: DebtType;
  principalAmount: number;
  currentBalance: number;
  emiAmount?: number;
  interestRate?: number;
  lender?: string;
}

interface Props {
  onUpdate?: () => void;
}

const emptyForm = {
  name: "",
  type: "PERSONAL_LOAN" as DebtType,
  principalAmount: "",
  currentBalance: "",
  emiAmount: "",
  interestRate: "",
  lender: "",
};

export function DebtManager({ onUpdate }: Props) {
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mission/debt");
      const json = await res.json() as { success: boolean; data: DebtRow[] };
      if (json.success) setDebts(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchDebts(); }, []);

  const handleAdd = async () => {
    const n = Number(form.principalAmount);
    const c = Number(form.currentBalance);
    if (!form.name || n <= 0 || c < 0) return;

    setSaving(true);
    try {
      await fetch("/api/mission/debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          principalAmount: n,
          currentBalance: c,
          ...(form.emiAmount && { emiAmount: Number(form.emiAmount) }),
          ...(form.interestRate && { interestRate: Number(form.interestRate) }),
          ...(form.lender && { lender: form.lender }),
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      await fetchDebts();
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBalance = async (id: string) => {
    const val = Number(editBalance);
    if (isNaN(val) || val < 0) return;
    await fetch("/api/mission/debt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, currentBalance: val }),
    });
    setEditingId(null);
    await fetchDebts();
    onUpdate?.();
  };

  const handleRemove = async (id: string) => {
    await fetch("/api/mission/debt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: false }),
    });
    await fetchDebts();
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card h-16 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debt list */}
      {debts.length > 0 ? (
        <div className="space-y-2">
          {debts.map((debt) => (
            <div key={debt.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{debt.name}</p>
                  <p className="text-[10px] text-ink-faint mt-0.5">
                    {DEBT_TYPES.find((t) => t.value === debt.type)?.label}
                    {debt.lender && ` · ${debt.lender}`}
                    {debt.interestRate && ` · ${debt.interestRate}% p.a.`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => {
                      setEditingId(debt.id);
                      setEditBalance(String(debt.currentBalance));
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-ink-muted hover:text-ink transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void handleRemove(debt.id)}
                    className="p-1.5 rounded-lg hover:bg-expense/10 text-ink-muted hover:text-expense transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {editingId === debt.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-ink-muted">Current balance:</span>
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="flex-1 text-xs bg-white/5 border border-glass-border rounded-lg px-2 py-1
                                 text-ink focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => void handleUpdateBalance(debt.id)}
                      className="p-1 rounded text-income hover:bg-income/10"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded text-ink-muted hover:bg-white/5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-expense to-expense/50"
                          style={{
                            width: `${Math.min(100, (debt.currentBalance / debt.principalAmount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-expense tabular-nums">
                      {formatCurrency(debt.currentBalance)}
                    </span>
                    <span className="text-[10px] text-ink-faint">
                      / {formatCurrency(debt.principalAmount)}
                    </span>
                  </>
                )}
              </div>

              {debt.emiAmount && editingId !== debt.id && (
                <p className="text-[10px] text-ink-muted mt-1.5">
                  EMI {formatCurrency(debt.emiAmount)}/mo
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <p className="text-xs text-ink-muted">No debts added yet.</p>
          <p className="text-[10px] text-ink-faint mt-1">
            Add your loans and credit cards to track payoff progress.
          </p>
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="glass-card p-4 space-y-3">
          <p className="text-xs font-medium text-ink">Add debt</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input
                placeholder="Name (e.g. HDFC Personal Loan)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs bg-white/5 border border-glass-border rounded-lg px-3 py-2
                           text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
              />
            </div>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as DebtType })}
              className="text-xs bg-surface border border-glass-border rounded-lg px-3 py-2
                         text-ink focus:outline-none focus:border-accent"
            >
              {DEBT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              placeholder="Lender (optional)"
              value={form.lender}
              onChange={(e) => setForm({ ...form, lender: e.target.value })}
              className="text-xs bg-white/5 border border-glass-border rounded-lg px-3 py-2
                         text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Principal amount (₹)"
              value={form.principalAmount}
              onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
              className="text-xs bg-white/5 border border-glass-border rounded-lg px-3 py-2
                         text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Current balance (₹)"
              value={form.currentBalance}
              onChange={(e) => setForm({ ...form, currentBalance: e.target.value })}
              className="text-xs bg-white/5 border border-glass-border rounded-lg px-3 py-2
                         text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="EMI / month (₹, optional)"
              value={form.emiAmount}
              onChange={(e) => setForm({ ...form, emiAmount: e.target.value })}
              className="text-xs bg-white/5 border border-glass-border rounded-lg px-3 py-2
                         text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Interest rate % (optional)"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
              className="text-xs bg-white/5 border border-glass-border rounded-lg px-3 py-2
                         text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void handleAdd()}
              disabled={saving || !form.name || !form.principalAmount}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-income/20 text-income
                         border border-income/30 hover:bg-income/30 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Add debt"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm); }}
              className="px-4 py-2 rounded-lg text-xs text-ink-muted border border-glass-border
                         hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     border border-dashed border-glass-border text-xs text-ink-muted
                     hover:border-income/40 hover:text-income transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add a debt
        </button>
      )}
    </div>
  );
}
