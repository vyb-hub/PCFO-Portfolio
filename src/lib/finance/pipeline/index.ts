export type { IFinancialPipeline } from "./IFinancialPipeline";
export type { PipelineResult, PipelineMetadata } from "./PipelineResult";
export { FinancialPipeline } from "./FinancialPipeline";
export { createDefaultPipeline } from "./PipelineFactory";

// EC-012: the intended consumer-facing entry point. IFinancialPipeline/
// createDefaultPipeline above remain as the lower-level primitive this
// wraps — still used directly by /dev/pipeline's inspector and by tests.
export type { IFinancialStateService } from "./IFinancialStateService";
export { FinancialStateService } from "./FinancialStateService";
export { createDefaultFinancialStateService } from "./PipelineFactory";
