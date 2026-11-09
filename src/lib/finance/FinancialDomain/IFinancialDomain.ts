// @depends-on: all domain services, IMetricsService, IAnalyticsService, IInsightEngine, IRecommendationEngine

import type { ICashFlowService } from "../cashflow/ICashFlowService";
import type { IDebtService } from "../debt/IDebtService";
import type { IGoalService } from "../goals/IGoalService";
import type { IInvestmentService } from "../investments/IInvestmentService";
import type { IMetricsService } from "../metrics/IMetricsService";
import type { IAnalyticsService } from "../analytics/IAnalyticsService";
import type { FinancialSnapshot } from "../analytics/FinancialSnapshot";
import type { IInsightEngine } from "../insights/IInsightEngine";
import type { IRecommendationEngine } from "../recommendations/IRecommendationEngine";

/**
 * Facade for the entire Financial Intelligence Layer.
 *
 * IFinancialDomain is the single dependency that orchestration consumers
 * (AI Coach, What-If Engine, Goal Planner, RAG pipeline) depend on.
 * Rather than injecting eight different services, a consumer injects
 * one IFinancialDomain and gets access to the full domain.
 *
 * Architectural role:
 *   - Composes all domain services into one coherent interface.
 *   - Owns the FinancialSnapshot build operation (cross-service orchestration).
 *   - Is the entry point for all future orchestration features.
 *
 * Dependency flow:
 *   (all financial domain services)
 *     → IFinancialDomain  ← you are here
 *     → ICoachService
 *     → IWhatIfEngine
 *     → IGoalPlanner
 *     → IFinancialMemoryService
 */
export interface IFinancialDomain {
  // ── Core domain services ────────────────────────────────────────────────
  readonly cashFlow: ICashFlowService;
  readonly debt: IDebtService;
  readonly goals: IGoalService;
  readonly investments: IInvestmentService;

  // ── Computed layers ────────────────────────────────────────────────────
  readonly metrics: IMetricsService;
  readonly analytics: IAnalyticsService;

  // ── Intelligence layers ────────────────────────────────────────────────
  readonly insights: IInsightEngine;
  readonly recommendations: IRecommendationEngine;

  // ── High-level orchestration ───────────────────────────────────────────
  /**
   * Build a complete, immutable FinancialSnapshot for the user.
   * This is the primary read model for the AI Coach, dashboards,
   * and all orchestration features.
   */
  buildSnapshot(userId: string): Promise<FinancialSnapshot>;
}
