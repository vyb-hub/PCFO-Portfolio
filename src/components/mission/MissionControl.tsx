"use client";

import { formatCurrency } from "@/lib/utils/categories";
import { cn } from "@/lib/utils/cn";
import type { MissionState } from "@/lib/mission/calculator";
import { ProgressRing } from "./ProgressRing";
import { DebtMeter } from "./DebtMeter";
import { Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  state: MissionState;
}

function HealthBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#f43f5e";
  const label =
    score >= 75 ? "Strong" : score >= 50 ? "Developing" : "Critical";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">Financial Health</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>
          {score}/100 · {label}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

function VelocityCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
}) {
  return (
    <div className="glass-card px-4 py-3 space-y-0.5">
      <p className="text-[10px] text-ink-muted uppercase tracking-wider">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", positive ? "text-income" : "text-expense")}>
        {value}
      </p>
      <p className="text-[10px] text-ink-faint">{sub}</p>
    </div>
  );
}

function LeversCard({
  vicePotential,
  subscriptionWaste,
}: {
  vicePotential: number;
  subscriptionWaste: number;
}) {
  const total = vicePotential + subscriptionWaste;
  if (total === 0) return null;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-medium text-ink">Recoverable capital</span>
        <span className="ml-auto text-sm font-semibold text-income tabular-nums">
          +{formatCurrency(total)}/mo
        </span>
      </div>
      {vicePotential > 0 && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-ink-muted">Vice spend reduction (30%)</span>
          <span className="text-income tabular-nums">+{formatCurrency(vicePotential)}</span>
        </div>
      )}
      {subscriptionWaste > 0 && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-ink-muted">Unused subscriptions</span>
          <span className="text-income tabular-nums">+{formatCurrency(subscriptionWaste)}</span>
        </div>
      )}
    </div>
  );
}

export function MissionControl({ state }: Props) {
  const savingsPct = (state.savingsProgress * 100).toFixed(0);
  const debtPct = (state.debtProgress * 100).toFixed(0);

  const milestoneLabel = state.projectedSavingsDate
    ? format(state.projectedSavingsDate, "MMM yyyy")
    : "—";

  const velocitySign = state.savingsVelocity >= 0;

  return (
    <div className="space-y-6">

      {/* Hero — dual rings */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-ink">Debt Freedom &amp; ₹5L Mission</h3>
            <p className="text-[11px] text-ink-muted mt-0.5">Primary objective · 3–6 month horizon</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-income/10 border border-income/20">
            {state.healthScore >= 50 ? (
              <CheckCircle className="w-3 h-3 text-income" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[10px] text-income font-medium">Active</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          {/* Savings ring */}
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              progress={state.savingsProgress}
              size={140}
              strokeWidth={10}
              color="#22c55e"
              trackColor="rgba(34,197,94,0.1)"
              label={formatCurrency(state.currentSavings)}
              sublabel={`${savingsPct}% of ₹5L`}
              glow={state.savingsProgress > 0.6}
            />
            <div className="text-center">
              <p className="text-[10px] text-ink-muted">Savings reserve</p>
              {state.projectedSavingsDate && (
                <p className="text-[10px] text-income font-medium">
                  Target: {milestoneLabel}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-28 w-px bg-white/5" />

          {/* Debt ring */}
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              progress={state.debtProgress}
              size={140}
              strokeWidth={10}
              color="#f43f5e"
              trackColor="rgba(244,63,94,0.1)"
              label={formatCurrency(state.totalDebt)}
              sublabel={`${debtPct}% cleared`}
              glow={state.debtProgress > 0.7}
            />
            <div className="text-center">
              <p className="text-[10px] text-ink-muted">Total debt</p>
              {state.projectedDebtFreeDate && (
                <p className="text-[10px] text-expense font-medium">
                  Free: {format(state.projectedDebtFreeDate, "MMM yyyy")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health + velocity row */}
      <div className="space-y-3">
        <div className="glass-card p-4">
          <HealthBar score={state.healthScore} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <VelocityCard
            label="Monthly savings"
            value={formatCurrency(state.monthlySavingsRate)}
            sub="this month"
            positive={state.monthlySavingsRate >= 0}
          />
          <VelocityCard
            label="Velocity Δ"
            value={`${velocitySign ? "+" : ""}${formatCurrency(state.savingsVelocity)}`}
            sub="vs last month"
            positive={velocitySign}
          />
          <VelocityCard
            label="Net cashflow"
            value={formatCurrency(state.netCashFlow)}
            sub="income – expenses"
            positive={state.netCashFlow >= 0}
          />
        </div>
      </div>

      {/* Debt breakdown */}
      {(state.debtItems.length > 0 || state.totalDebt > 0) && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-expense" />
            <h4 className="text-xs font-semibold text-ink">Debt breakdown</h4>
          </div>
          <DebtMeter
            totalDebt={state.totalDebt}
            totalOriginalDebt={state.totalOriginalDebt}
            debtPaidToDate={state.debtPaidToDate}
            debtProgress={state.debtProgress}
            monthlyPayment={state.monthlyDebtPayment}
            projectedDebtFreeDate={state.projectedDebtFreeDate}
            monthsToDebtFree={state.monthsToDebtFree}
            debtItems={state.debtItems}
          />
        </div>
      )}

      {/* Recoverable capital */}
      <LeversCard
        vicePotential={state.viceSavingsPotential}
        subscriptionWaste={state.subscriptionWaste}
      />

      {/* 12-month timeline */}
      {state.timeline.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-ink mb-3">12-month projection</h4>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-0" style={{ minWidth: "480px" }}>
              {state.timeline.map((point) => {
                const pct = Math.min(
                  100,
                  (point.projectedSavings / state.savingsGoalAmount) * 100
                );
                const isGoalMonth =
                  state.projectedSavingsDate &&
                  format(new Date(point.month), "yyyy-MM") ===
                    format(state.projectedSavingsDate, "yyyy-MM");
                return (
                  <div key={point.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="relative w-full h-16 flex items-end justify-center">
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all",
                          isGoalMonth
                            ? "bg-income"
                            : "bg-income/30"
                        )}
                        style={{ height: `${Math.max(4, pct * 0.6)}px` }}
                      />
                    </div>
                    <span className="text-[8px] text-ink-faint">
                      {format(new Date(point.month), "MMM")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
