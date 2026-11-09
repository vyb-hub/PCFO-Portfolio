import type { DateRange } from "../types/DateRange";

export enum AggregateGranularity {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUAL = "ANNUAL",
  ALL_TIME = "ALL_TIME",
}

export interface AggregatePeriod {
  readonly range: DateRange;
  /** Human-readable label, e.g. "2026-06", "Q2 2026", "FY 2025-26" */
  readonly label: string;
  readonly granularity: AggregateGranularity;
}
