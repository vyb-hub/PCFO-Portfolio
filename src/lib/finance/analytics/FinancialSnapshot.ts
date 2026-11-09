import type { CashFlow } from "../cashflow/CashFlow";
import type { DebtSummary } from "../debt/DebtSummary";
import type { Portfolio } from "../investments/Portfolio";
import type { Goal } from "../goals/Goal";
import type { FinancialHealthScore } from "../types/FinancialHealth";
import type { Money } from "../types/Money";
import type { FinancialMetric } from "../metrics/FinancialMetric";

/**
 * Point-in-time, immutable snapshot of a user's complete financial picture.
 *
 * ## Value Object contract
 * - Every property and nested collection is readonly.
 * - Snapshots are never mutated. Downstream services that need an updated
 *   view must call ISnapshotBuilder.build() to produce a new snapshot.
 * - The `snapshotAt` timestamp identifies which point in time this
 *   snapshot represents and serves as its natural identity.
 *
 * ## Consumers
 * - Dashboards: direct read model.
 * - IInsightEngine: generates insights from health score and metrics.
 * - IRecommendationEngine: determines recommendation priority.
 * - ICoachService: seeds the AI Coach's context window.
 * - IWhatIfEngine: baseline for simulation (produces a second projected snapshot).
 * - IFinancialMemoryService: snapshot content is summarised and stored as memory.
 */
export interface FinancialSnapshot {
  readonly userId: string;
  readonly snapshotAt: Date;
  readonly cashFlow: Readonly<CashFlow>;
  readonly debtSummary: Readonly<DebtSummary>;
  readonly portfolio: Readonly<Portfolio>;
  readonly goals: ReadonlyArray<Goal>;
  readonly healthScore: Readonly<FinancialHealthScore>;
  /**
   * All metrics computed for the snapshot period.
   * Stored inline so consumers (Insights, Coach) do not need to
   * re-fetch metrics separately.
   */
  readonly metrics: ReadonlyArray<FinancialMetric>;
  /** Net worth = total assets − total liabilities */
  readonly netWorth: Readonly<Money>;
  /** Monthly surplus = total income − total expenses − minimum debt payments */
  readonly monthlySurplus: Readonly<Money>;
}
