import type { MetricType, MetricUnit, MetricTrend } from "./MetricType";
import type { MetricPeriod } from "./MetricPeriod";
import type { MetricDefinition } from "./MetricDefinition";

/**
 * A computed financial metric scoped to a user and period.
 *
 * FinancialMetric is the persistence and display model — it enriches
 * a raw MetricResult with user identity, trend tracking, and history context.
 * It is what an API route returns and what the database stores.
 *
 * To compute a new value, use MetricsEngine → MetricResult.
 * To enrich with trend/history, convert to FinancialMetric at the service layer.
 */
export interface FinancialMetric {
  readonly id: string;
  readonly userId: string;
  readonly type: MetricType;
  readonly period: MetricPeriod;
  readonly value: number;
  readonly unit: MetricUnit;
  readonly trend: MetricTrend;
  readonly previousValue: number | null;
  readonly changePercent: number | null;
  readonly computedAt: Date;
  /** Full metric definition — carried for self-describing API responses. */
  readonly definition: MetricDefinition;
}
