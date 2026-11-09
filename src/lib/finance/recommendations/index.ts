// Enums
export { RecommendationCategory } from "./RecommendationCategory";
export { RecommendationPriority } from "./RecommendationPriority";
export { RecommendationAction } from "./RecommendationAction";
export { RecommendationConfidence } from "./RecommendationConfidence";
export { RecommendationGeneratorType } from "./RecommendationGeneratorType";
export { ImpactDimension } from "./RecommendationImpact";

// Types
export type { Recommendation } from "./Recommendation";
export type { RecommendationImpact } from "./RecommendationImpact";
export type { RecommendationMetadata } from "./RecommendationMetadata";
export type { RecommendationSnapshot, RecommendationGenerationFailure } from "./RecommendationSnapshot";
export type { RecommendationSummary } from "./RecommendationSummary";
export type { RecommendationGeneratorDefinition } from "./RecommendationGeneratorDefinition";

// Plugin interface + registry
export type { RecommendationGenerator } from "./RecommendationGenerator";
export { RecommendationRegistry } from "./RecommendationRegistry";

// Engine
export type { IRecommendationEngine } from "./IRecommendationEngine";
export { RecommendationEngine } from "./RecommendationEngine";

// Service contract
export type { IRecommendationService } from "./IRecommendationService";

// Generators + factory
export {
  DebtRecommendationGenerator,
  SavingsRecommendationGenerator,
  InvestmentRecommendationGenerator,
  CashFlowRecommendationGenerator,
  GoalRecommendationGenerator,
  LifestyleRecommendationGenerator,
  RiskMitigationRecommendationGenerator,
  createDefaultRecommendationEngine,
} from "./generators";
