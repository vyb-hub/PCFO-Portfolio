import type { Money } from "../types/Money";
import type { Frequency } from "../types/Frequency";

/**
 * Finance domain's view of a recurring payment or subscription.
 * Sourced from Subscription and Mandate records in the database.
 *
 * Future milestone: a dedicated subscriptions/ domain module will own this type.
 */
export interface RecurringPayment {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly merchant: string | null;
  readonly amount: Money;
  readonly frequency: Frequency;
  readonly nextDueDate: Date | null;
  readonly isActive: boolean;
  readonly category: string | null;
  readonly startedAt: Date | null;
}
