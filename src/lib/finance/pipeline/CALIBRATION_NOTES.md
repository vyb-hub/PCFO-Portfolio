# EC-010 Pipeline Calibration Notes

These notes document known mapping assumptions and first-run limitations. They are architectural facts, not bugs. Each finding has a status: **Accepted** (by design), **Pending** (needs a future milestone), or **Monitor** (watch in production).

---

## Finding #1 — No Investment model in Prisma schema

**Status:** Accepted (Pending investment milestone)

`PrismaInvestmentRepository` always returns `[]` because no `Investment` table exists in the schema.

**Impact:**
- `NetWorthCalculator` computes net worth as `−total_debt` (no investment assets).
- `InvestmentInsightGenerator` will produce no insights.
- `InvestmentRecommendationGenerator` may produce "start investing" recommendations regardless of actual portfolio.

**Resolution:** Add an `Investment` model to the Prisma schema in a future milestone. Until then, net worth figures are underrepresented for users with investments.

---

## Finding #2 — First-run analytics degradation

**Status:** Accepted (by design — improves automatically with data)

On the first pipeline run, only one `FinancialMetricsSnapshot` exists (the current one). This affects:

- **TrendService:** Returns `INSUFFICIENT_DATA` direction for all metrics. No slope, no acceleration, no regression. This is correct — a trend requires at least two data points.
- **AnalyticsEngine:** Skips analyzers with `minimumSnapshots > 1`:
  - `TrendAnalyzer` (requires 2)
  - `VarianceAnalyzer` (requires 2)
  - `GoalProgressAnalyzer` (requires 2)
  - `BehaviourAnalyzer` (requires 3)
  - `SeasonalityAnalyzer` (requires 4)
  - Only `RiskAnalyzer` (requires 1) runs on the first execution.

`PipelineResult.metadata.analyticsAnalyzersSkipped` reflects the exact count.

**Resolution:** Analytics depth improves automatically as monthly snapshots accumulate. No action required; this is the expected cold-start behaviour.

---

## Finding #3 — Nullable debt fields default to safe values

**Status:** Accepted

The `Debt` domain model has non-nullable fields that map to nullable Prisma columns. Defaults applied:

| Prisma field | Domain field | Default when null |
|---|---|---|
| `interestRate: Float?` | `interestRate: number` | `0` (0% interest) |
| `emiAmount: Float?` | `minimumPayment.amount` | `0` (no minimum) |
| `lender: String?` | `lender: string` | `"Unknown"` |
| `startDate: DateTime?` | `startDate: string` | Record `createdAt` |
| `emiDate: Int?` | `dueDate: string` | Record `createdAt` (as ISO string) |

`paymentFrequency` defaults to `MONTHLY` (no frequency field in DB).

These defaults mean zero-interest debts and debts without EMI amounts are structurally valid but may produce less accurate DTI and affordability calculations.

---

## Finding #4 — Goal domain fields derived from DB state

**Status:** Accepted

The `Goal` domain model has fields that do not exist in the Prisma schema. Derivation rules:

| Domain field | Derivation |
|---|---|
| `status` | Derived from `isActive` + progress ratio: ≥100% → ACHIEVED, ≥75% → ON_TRACK, ≥25% → IN_PROGRESS, >0% → AT_RISK, 0% → NOT_STARTED, inactive → ABANDONED |
| `priority` | `isPrimary=true` → 1, others → position in sorted list |
| `contributionFrequency` | Always `MONTHLY` (no frequency field in DB) |
| `targetDate` | Defaults to 1 year from now if `targetDate` is null |

---

## Finding #5 — GoalType mapping gaps

**Status:** Accepted

Two DB `GoalType` values have no domain equivalent:

| DB value | Domain mapping | Note |
|---|---|---|
| `SAVINGS_RESERVE` | `GoalType.CUSTOM` | The ₹5L target — treated as a custom savings goal |
| `INVESTMENT` | `GoalType.CUSTOM` | No investment goal type in domain model |

---

## Finding #6 — Subscription frequency YEARLY → ANNUALLY

**Status:** Accepted

DB `SubscriptionFreq.YEARLY` maps to domain `Frequency.ANNUALLY`. This is a naming difference only; no data loss.

---

## Finding #7 — Mandate amounts

**Status:** Monitor

`Mandate` records have two amount fields:
- `mandateLimit: Float` — the maximum authorized debit
- `amount: Float?` — the actual charge amount (nullable)

`PrismaRecurringPaymentRepository` uses `amount` when available, falling back to `mandateLimit`. This may overstate recurring spend for mandates where the limit is set conservatively high.

**Watch for:** Recurring spend metrics appearing inflated in users with high-limit mandates.

---

## Finding #8 — Budget AggregatePeriod construction

**Status:** Accepted

Budgets in the DB define a period *type* (MONTHLY) and a `startDate`, but not an explicit `DateRange`. `PrismaBudgetRepository` constructs the `AggregatePeriod.range` by advancing `startDate` by one period unit. This means budget ranges are anchored to the budget's creation date, not the current month.

Implication: `IBudgetRepository.findByPeriod()` uses date-overlap logic (startDate ≤ period.end AND endDate ≥ period.start) to correctly identify active budgets for any given period.

---

## Summary Table

| Finding | Severity | Status |
|---|---|---|
| No Investment model | Medium (net worth underreported) | Pending |
| First-run analytics degradation | Low (expected cold start) | Accepted |
| Nullable debt defaults | Low (safe defaults) | Accepted |
| Goal field derivation | Low (deterministic rules) | Accepted |
| GoalType mapping gaps | Low (maps to CUSTOM) | Accepted |
| YEARLY → ANNUALLY | None (naming only) | Accepted |
| Mandate amount fallback | Low–Medium | Monitor |
| Budget period construction | Low | Accepted |
