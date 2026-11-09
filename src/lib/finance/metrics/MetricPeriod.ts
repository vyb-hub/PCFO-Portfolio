import type { DateRange } from "../types/DateRange";

export enum MetricGranularity {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUAL = "ANNUAL",
  CUSTOM = "CUSTOM",
}

/**
 * The time period for which a metric was computed.
 */
export interface MetricPeriod {
  readonly range: DateRange;
  /** Human-readable label, e.g. "2025-06", "Q2 2025", "Last 12 months". */
  readonly label: string;
  readonly granularity: MetricGranularity;
}
