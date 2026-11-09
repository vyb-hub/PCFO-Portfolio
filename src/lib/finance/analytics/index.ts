// Legacy types from EC-001/002 — retained for compatibility
export * from "./SpendingPattern";
export * from "./IncomePattern";
export * from "./FinancialSnapshot";

// Analytics Platform enums
export { AnalyzerType } from "./AnalyzerType";
export { AnalysisFindingType } from "./AnalysisFindingType";
export { TrendDirection } from "./TrendDirection";

// Analytics Platform types
export type { AnalyzerDefinition } from "./AnalyzerDefinition";
export type { AnalyticsFinding } from "./AnalyticsFinding";
export type { AnalyticsMetadata } from "./AnalyticsMetadata";
export type { AnalyticsSnapshot, AnalysisExecutionFailure } from "./AnalyticsSnapshot";
export type { AnalyticsSummary } from "./AnalyticsSummary";

// Plugin interface + registry
export type { AnalyticsAnalyzer } from "./AnalyticsAnalyzer";
export { AnalyticsRegistry } from "./AnalyticsRegistry";

// Engine
export type { IAnalyticsEngine } from "./IAnalyticsEngine";
export { AnalyticsEngine } from "./AnalyticsEngine";

// Service contract
export type { IAnalyticsService } from "./IAnalyticsService";

// Analyzers + factory
export {
  TrendAnalyzer,
  VarianceAnalyzer,
  SeasonalityAnalyzer,
  BehaviourAnalyzer,
  GoalProgressAnalyzer,
  RiskAnalyzer,
  createDefaultAnalyticsEngine,
} from "./analyzers";

// NOTE: analytics/history/ is intentionally NOT re-exported here.
// ISnapshotHistoryProvider and SnapshotQuery are implementation details
// of the Analytics Platform — not public architectural contracts.
