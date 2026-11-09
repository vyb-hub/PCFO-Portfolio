"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { TransactionDTO } from "@/types";

interface Props {
  transactions: TransactionDTO[];
}

export function RecentTransactions({ transactions }: Props) {
  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-accent-light transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
          No transactions yet. Sync your Gmail to get started.
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: TransactionDTO }) {
  const isDebit = tx.type === "DEBIT";
  const displayName = tx.merchant ?? tx.description;

  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/3 transition-colors group">
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: `${tx.categoryColor}18` }}
      >
        {tx.categoryIcon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-medium truncate">{displayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-ink-muted">
            {format(parseISO(tx.date), "dd MMM")}
          </p>
          <span className="text-ink-faint text-xs">·</span>
          <p className="text-xs text-ink-muted">{tx.categoryDisplay}</p>
          {tx.isRecurring && (
            <>
              <span className="text-ink-faint text-xs">·</span>
              <span className="text-[10px] text-ink-faint bg-white/5 px-1.5 py-0.5 rounded">
                Recurring
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={cn(
          "text-sm font-semibold tabular-nums",
          isDebit ? "text-expense" : "text-income"
        )}>
          {isDebit ? "−" : "+"}{formatCurrency(tx.amount, tx.currency)}
        </p>
        {tx.accountLast4 && (
          <p className="text-[10px] text-ink-faint">••{tx.accountLast4}</p>
        )}
      </div>
    </div>
  );
}
