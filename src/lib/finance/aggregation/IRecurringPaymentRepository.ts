import type { RecurringPayment } from "./RecurringPayment";

/**
 * Port: recurring payment and subscription data access.
 * Implementations live outside the finance domain (e.g., PrismaRecurringPaymentRepository).
 */
export interface IRecurringPaymentRepository {
  findByUser(userId: string): Promise<ReadonlyArray<RecurringPayment>>;
  findActive(userId: string): Promise<ReadonlyArray<RecurringPayment>>;
}
