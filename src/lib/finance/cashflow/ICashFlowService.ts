// @depends-on: TransactionRepository

import type { DateRange } from "../types/DateRange";
import type { CashFlow } from "./CashFlow";
import type { CashFlowStatement } from "./CashFlowStatement";

/** Describes an anomalous cash flow event */
export interface CashFlowAnomaly {
  readonly date: string;
  readonly description: string;
  /** "UNUSUAL_SPIKE" | "UNUSUAL_DROP" | "DUPLICATE" | "LARGE_TRANSFER" */
  readonly type: string;
  readonly amount: import("../types/Money").Money;
  readonly severity: "LOW" | "MEDIUM" | "HIGH";
}

/** A forward-looking cash flow projection */
export interface CashFlowForecast {
  readonly period: DateRange;
  readonly projectedIncome: import("../types/Money").Money;
  readonly projectedExpenses: import("../types/Money").Money;
  readonly projectedNetFlow: import("../types/Money").Money;
  readonly confidenceScore: number; // 0–1
}

/**
 * Service contract for all cash flow computations.
 * Implementations must read from the transactions table via TransactionRepository.
 */
export interface ICashFlowService {
  /**
   * Compute a full CashFlowStatement for the given user and period.
   * Reads transactions within `period` and classifies them into income/expense buckets.
   */
  computeForPeriod(userId: string, period: DateRange): Promise<CashFlowStatement>;

  /**
   * Return the average monthly CashFlow over the last N months (default 6).
   * Used for budgeting baselines and health score calculations.
   */
  getMonthlyAverage(userId: string, monthsBack?: number): Promise<CashFlow>;

  /**
   * Scan transactions for anomalous patterns (spikes, duplicates, unusual large transfers).
   * Used by the InsightEngine to generate ANOMALY insights.
   */
  detectAnomalies(userId: string, period: DateRange): Promise<readonly CashFlowAnomaly[]>;

  /**
   * Forecast the next period's cash flow based on historical patterns.
   * Relies on at least 3 months of history for meaningful projections.
   */
  forecastNextPeriod(userId: string): Promise<CashFlowForecast>;
}
