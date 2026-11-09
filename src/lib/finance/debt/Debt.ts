import type { Money } from "../types/Money";
import type { Frequency } from "../types/Frequency";

export enum DebtType {
  CREDIT_CARD = "CREDIT_CARD",
  PERSONAL_LOAN = "PERSONAL_LOAN",
  HOME_LOAN = "HOME_LOAN",
  CAR_LOAN = "CAR_LOAN",
  EDUCATION_LOAN = "EDUCATION_LOAN",
  BUSINESS_LOAN = "BUSINESS_LOAN",
  BUY_NOW_PAY_LATER = "BUY_NOW_PAY_LATER",
  OTHER = "OTHER",
}

export enum DebtStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  DEFAULTED = "DEFAULTED",
  SETTLED = "SETTLED",
}

/**
 * Domain model representing a single debt instrument.
 */
export interface Debt {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly type: DebtType;
  readonly lender: string;
  readonly principalOriginal: Money;
  readonly principalOutstanding: Money;
  /** Annual interest rate as a decimal, e.g. 0.18 for 18% */
  readonly interestRate: number;
  readonly minimumPayment: Money;
  readonly paymentFrequency: Frequency;
  /** ISO date string of the next due date */
  readonly dueDate: string;
  /** ISO date string of the loan start date */
  readonly startDate: string;
  /** ISO date string of the loan end date (maturity), if applicable */
  readonly endDate?: string;
  readonly status: DebtStatus;
}
