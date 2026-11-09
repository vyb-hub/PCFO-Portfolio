/**
 * A bank or card account derived from transaction data.
 * PCFO does not have a dedicated Account model — accounts are inferred
 * from the transaction stream.
 */
export interface AccountSummary {
  /** Bank account number, UPI VPA, or card identifier string as reported in transaction data */
  readonly accountIdentifier: string;
  /** Last 4 digits of the account or card, if available */
  readonly accountLast4: string | null;
  readonly transactionCount: number;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
}
