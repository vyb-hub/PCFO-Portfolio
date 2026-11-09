import type { Money } from "../types/Money";
import type { Investment, InvestmentType } from "./Investment";

/**
 * Asset allocation breakdown by investment type.
 * Keys are InvestmentType enum values; values are fractions (0–1).
 */
export type AssetAllocation = Readonly<Record<InvestmentType, number>>;

/**
 * Aggregate view of a user's entire investment portfolio.
 */
export interface Portfolio {
  readonly userId: string;
  readonly investments: readonly Investment[];
  readonly totalCurrentValue: Money;
  readonly totalInvestedAmount: Money;
  readonly overallAbsoluteReturn: Money;
  /** Portfolio-level XIRR; null if insufficient data */
  readonly overallXIRR: number | null;
  readonly assetAllocation: AssetAllocation;
  /** ISO timestamp */
  readonly computedAt: string;
}
