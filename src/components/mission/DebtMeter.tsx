"use client";

import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { DebtItem } from "@/lib/mission/calculator";
import { TrendingDown } from "lucide-react";

interface Props {
  totalDebt: number;
  totalOriginalDebt: number;
  debtPaidToDate: number;
  debtProgress: number;
  monthlyPayment: number;
  projectedDebtFreeDate: Date | null;
  monthsToDebtFree: number | null;
  debtItems: DebtItem[];
}

const DEBT_TYPE_LABELS: Record<string, string> = {
  HOME_LOAN: "Home Loan",
  CAR_LOAN: "Car Loan",
  PERSONAL_LOAN: "Personal Loan",
  CREDIT_CARD: "Credit Card",
  EDUCATION_LOAN: "Education Loan",
  BNPL: "Buy Now Pay Later",
  OTHER: "Other",
};

export function DebtMeter({
  totalDebt,
  totalOriginalDebt,
  debtPaidToDate,
  debtProgress,
  monthlyPayment,
  projectedDebtFreeDate,
  monthsToDebtFree,
  debtItems,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Total debt progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-ink-muted">Total debt remaining</span>
          <span className="text-xs font-medium text-expense tabular-nums">
            {formatCurrency(totalDebt)}
          </span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-expense to-expense/60 transition-all"
            style={{ width: `${(1 - debtProgress) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-income">
            ✓ {formatCurrency(debtPaidToDate)} paid
          </span>
          <span className="text-[10px] text-ink-muted">
            of {formatCurrency(totalOriginalDebt)} original
          </span>
        </div>
      </div>

      {/* Individual debt bars */}
      {debtItems.length > 0 && (
        <div className="space-y-2.5">
          {debtItems.map((debt) => (
            <div key={debt.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink truncate max-w-36">
                    {debt.name}
                  </span>
                  <span className="text-[10px] text-ink-faint">
                    {DEBT_TYPE_LABELS[debt.type] ?? debt.type}
                  </span>
                </div>
                <span className="text-xs text-ink tabular-nums flex-shrink-0">
                  {formatCurrency(debt.currentBalance)}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${100 - debt.percentPaid}%`,
                    background: "linear-gradient(90deg, #f43f5e, #f43f5e88)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-income">
                  {debt.percentPaid.toFixed(0)}% paid
                </span>
                {debt.emiAmount > 0 && (
                  <span className="text-[9px] text-ink-muted">
                    EMI {formatCurrency(debt.emiAmount)}/mo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projection */}
      {projectedDebtFreeDate && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-income-border bg-income-muted">
          <TrendingDown className="w-4 h-4 text-income flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-ink">
              Projected debt-free:{" "}
              <span className="text-income">
                {projectedDebtFreeDate.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">
              {monthsToDebtFree} months at {formatCurrency(monthlyPayment)}/mo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
