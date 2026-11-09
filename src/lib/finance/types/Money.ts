/**
 * Money value object representing an amount in a specific currency.
 * Default currency is INR for this application.
 */
export interface Money {
  readonly amount: number;
  readonly currency: string;
}

/** Arithmetic helper types — implementations live in the service layer */
export type MoneyAdd = (a: Money, b: Money) => Money;
export type MoneySubtract = (a: Money, b: Money) => Money;
export type MoneyMultiply = (a: Money, factor: number) => Money;
export type MoneyCompare = (a: Money, b: Money) => -1 | 0 | 1;

/** Convenience factory type */
export type MakeMoney = (amount: number, currency?: string) => Money;
