// Core enums
export { MetricType, MetricUnit, MetricTrend, CalculationFrequency } from "./MetricType";
export { MetricCategory } from "./MetricCategory";
export { AggregateRequirement } from "./AggregateRequirement";
export { MetricGranularity } from "./MetricPeriod";

// Types
export type { MetricPeriod } from "./MetricPeriod";
export type { MetricThreshold, MetricDefinition } from "./MetricDefinition";
export type { MetricResult, MetricEvaluation } from "./MetricResult";
export type { FinancialMetric } from "./FinancialMetric";
export type { MetricCalculator } from "./MetricCalculator";
export type { IMetricsEngine } from "./IMetricsEngine";

// Service contracts (application layer)
export type { IMetricsService } from "./IMetricsService";

// Engine + Registry (infrastructure)
export { MetricRegistry } from "./MetricRegistry";
export { MetricsEngine, MetricNotSupportedError } from "./MetricsEngine";

// Calculators + factory
export {
  SavingsRateCalculator,
  CashFlowCalculator,
  BurnRateCalculator,
  NetWorthCalculator,
  DebtToIncomeCalculator,
  CreditUtilisationCalculator,
  RecurringSpendCalculator,
  createDefaultMetricsEngine,
} from "./calculators";

// Snapshot Platform — canonical representation of a user's metrics at a point in time
export {
  CURRENT_SNAPSHOT_VERSION,
  formatSnapshotVersion,
  FinancialMetricsSnapshotBuilder,
  FinancialMetricsSnapshotService,
} from "./snapshot";
export type {
  SnapshotVersion,
  SnapshotMetadata,
  FinancialMetricsSnapshot,
  MetricExecutionFailure,
  SnapshotSummary,
  IFinancialMetricsSnapshotService,
} from "./snapshot";
