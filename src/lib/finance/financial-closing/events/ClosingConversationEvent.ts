/**
 * Financial Closing's own typed domain events — plain value objects, not a
 * pub/sub bus. No event infrastructure exists in this codebase and none is
 * needed: FinancialMonthClosingService constructs one of these and hands it
 * straight to FinancialClosingNotifier via a direct method call, synchronous
 * and in-process. See ADR-021 fork #3.
 */
export interface StatementMissingEvent {
  readonly kind: "STATEMENT_MISSING";
  readonly userId: string;
  readonly monthId: string;
  readonly periodLabel: string;
  readonly missingLabels: ReadonlyArray<string>;
}

export interface MonthReadyToCloseEvent {
  readonly kind: "MONTH_READY_TO_CLOSE";
  readonly userId: string;
  readonly monthId: string;
  readonly periodLabel: string;
}

export interface MonthClosedEvent {
  readonly kind: "MONTH_CLOSED";
  readonly userId: string;
  readonly monthId: string;
  readonly periodLabel: string;
}

export interface SalaryConfirmedEvent {
  readonly kind: "SALARY_CONFIRMED";
  readonly userId: string;
  readonly monthId: string;
  readonly periodLabel: string;
}

export type ClosingConversationEvent =
  | StatementMissingEvent
  | MonthReadyToCloseEvent
  | MonthClosedEvent
  | SalaryConfirmedEvent;
