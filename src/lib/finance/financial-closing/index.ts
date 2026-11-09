// Enums
export { FinancialMonthStatus } from "./FinancialMonthStatus";
export { RequiredStatementType } from "./RequiredStatementType";
export { ChecklistItemStatus } from "./ChecklistItemStatus";

// Domain types
export type { ChecklistItem } from "./ChecklistItem";
export type { StatementRequirement } from "./StatementRequirement";
export type { FinancialMonth } from "./FinancialMonth";
export type { ClosingSnapshot } from "./ClosingSnapshot";
export { CLOSING_SNAPSHOT_SCHEMA_VERSION, buildClosingSnapshot } from "./ClosingSnapshot";

// Repository ports
export type { IFinancialMonthRepository } from "./IFinancialMonthRepository";
export type { IStatementRequirementRepository } from "./IStatementRequirementRepository";

// Pure logic
export { StatementMatcher } from "./StatementMatcher";
export type { UploadMatchCandidate } from "./StatementMatcher";
export { ClosingReadinessEvaluator } from "./ClosingReadinessEvaluator";

// Domain events + Conversation Platform bridge
export type {
  ClosingConversationEvent,
  StatementMissingEvent,
  MonthReadyToCloseEvent,
  MonthClosedEvent,
  SalaryConfirmedEvent,
} from "./events/ClosingConversationEvent";
export { ClosingConversationEventMapper } from "./ClosingConversationEventMapper";
export type { MappedConversationEvent } from "./ClosingConversationEventMapper";
export { FinancialClosingNotifier } from "./FinancialClosingNotifier";

// Orchestrator
export { FinancialMonthClosingService, NotReadyToCloseError } from "./FinancialMonthClosingService";

// Wiring
export { createDefaultFinancialMonthClosingService } from "./FinancialClosingFactory";
