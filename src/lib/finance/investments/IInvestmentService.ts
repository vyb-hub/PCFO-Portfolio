// @depends-on: InvestmentRepository, TransactionRepository

import type { Investment, InvestmentType } from "./Investment";
import type { Portfolio, AssetAllocation } from "./Portfolio";
import type { RiskProfile } from "../types/RiskProfile";

/** A rebalancing suggestion for a single asset class */
export interface RebalanceSuggestion {
  readonly investmentType: InvestmentType;
  readonly currentAllocation: number;
  readonly targetAllocation: number;
  /** Positive = buy more, negative = sell/reduce */
  readonly delta: number;
  readonly rationale: string;
}

/**
 * Service contract for investment portfolio management.
 * Implementations read from InvestmentRepository and enrich with
 * market data where available.
 */
export interface IInvestmentService {
  /**
   * Return the full portfolio snapshot for a user,
   * including all holdings, total values, and asset allocation.
   */
  getPortfolio(userId: string): Promise<Portfolio>;

  /**
   * Compute the Extended Internal Rate of Return (XIRR) for a specific investment.
   * Requires a series of dated cash flows from TransactionRepository.
   */
  computeXIRR(userId: string, investmentId: string): Promise<number | null>;

  /**
   * Return the current asset allocation breakdown for the user's portfolio.
   * Values are fractions summing to 1.
   */
  getAssetAllocation(userId: string): Promise<AssetAllocation>;

  /**
   * Generate rebalancing suggestions based on the user's risk profile
   * and ideal target allocations for that profile.
   */
  rebalanceSuggestion(
    userId: string,
    riskProfile: RiskProfile
  ): Promise<readonly RebalanceSuggestion[]>;
}
