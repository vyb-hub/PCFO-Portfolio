// Enums
export { InsightCategory } from "./InsightCategory";
export { InsightSeverity } from "./InsightSeverity";
export { InsightConfidence, toInsightConfidence } from "./InsightConfidence";
export { InsightGeneratorType } from "./InsightGeneratorType";

// Types
export type { Insight } from "./Insight";
export type { InsightMetadata } from "./InsightMetadata";
export type { InsightSnapshot, InsightGenerationFailure } from "./InsightSnapshot";
export type { InsightSummary } from "./InsightSummary";
export type { InsightGeneratorDefinition } from "./InsightGeneratorDefinition";

// Plugin interface + registry
export type { InsightGenerator } from "./InsightGenerator";
export { InsightRegistry } from "./InsightRegistry";

// Engine
export type { IInsightEngine } from "./IInsightEngine";
export { InsightEngine } from "./InsightEngine";

// Service contract
export type { IInsightService } from "./IInsightService";

// Generators + factory (legacy analytics-pipeline system)
export {
  TrendInsightGenerator,
  BehaviourInsightGenerator,
  RiskInsightGenerator,
  GoalInsightGenerator,
  OpportunityInsightGenerator,
  SpendingInsightGenerator,
  createDefaultInsightEngine,
} from "./generators";

// ─── Financial Insight Engine (EC-007) ────────────────────────────────────────

// Enums
export { InsightType } from "./InsightType";
export { InsightSeverityLevel } from "./InsightSeverityLevel";
export { InsightMetricCategory } from "./InsightMetricCategory";
export { FinancialInsightGeneratorType } from "./FinancialInsightGeneratorType";

// Domain types
export type { FinancialInsight } from "./FinancialInsight";
export type { FinancialInsightGeneratorDefinition } from "./FinancialInsightGeneratorDefinition";
export type { FinancialInsightSummary } from "./FinancialInsightSummary";
export type { FinancialInsightStatistics } from "./FinancialInsightStatistics";
export type { FinancialInsightMetadata } from "./FinancialInsightMetadata";
export type {
  FinancialInsightSnapshot,
  FinancialInsightGenerationFailure,
} from "./FinancialInsightSnapshot";
export { FINANCIAL_INSIGHT_SNAPSHOT_VERSION } from "./FinancialInsightSnapshot";

// Plugin interface + registry
export type { IInsightGenerator } from "./IInsightGenerator";
export { FinancialInsightRegistry } from "./FinancialInsightRegistry";

// Engine + service
export type { IFinancialInsightEngine } from "./IFinancialInsightEngine";
export { FinancialInsightEngine } from "./FinancialInsightEngine";
export type { IFinancialInsightService } from "./IFinancialInsightService";
export { FinancialInsightService } from "./FinancialInsightService";

// Generators + factory (metric + trend pipeline)
export {
  SavingsInsightGenerator,
  CashFlowInsightGenerator,
  DebtInsightGenerator,
  DebtToIncomeInsightGenerator,
  CreditInsightGenerator,
  SpendingMetricInsightGenerator,
  InvestmentInsightGenerator,
  EmergencyFundInsightGenerator,
  NetWorthInsightGenerator,
  GoalMetricInsightGenerator,
  createDefaultFinancialInsightEngine,
  createDefaultFinancialInsightService,
} from "./generators/financialInsightFactory";

// Extension interfaces (not implemented — plugin contracts for future use)
export type { INarrativeGenerator } from "./extensions/INarrativeGenerator";
export type { IInsightRanker } from "./extensions/IInsightRanker";
export type { IInsightDeduplicator } from "./extensions/IInsightDeduplicator";
export type { IInsightLocalizer } from "./extensions/IInsightLocalizer";
