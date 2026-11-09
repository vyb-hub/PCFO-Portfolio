import type { Money } from "../types/Money";

const DEFAULT_CURRENCY = "INR";

export const MoneyUtils = {
  make(amount: number, currency = DEFAULT_CURRENCY): Money {
    return { amount, currency };
  },

  zero(currency = DEFAULT_CURRENCY): Money {
    return { amount: 0, currency };
  },

  add(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return { amount: a.amount + b.amount, currency: a.currency };
  },

  subtract(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return { amount: a.amount - b.amount, currency: a.currency };
  },

  multiply(a: Money, factor: number): Money {
    return { amount: a.amount * factor, currency: a.currency };
  },

  /** Returns -1, 0, or 1. */
  compare(a: Money, b: Money): -1 | 0 | 1 {
    assertSameCurrency(a, b);
    if (a.amount < b.amount) return -1;
    if (a.amount > b.amount) return 1;
    return 0;
  },

  isPositive(m: Money): boolean {
    return m.amount > 0;
  },

  isZero(m: Money): boolean {
    return m.amount === 0;
  },

  abs(m: Money): Money {
    return { amount: Math.abs(m.amount), currency: m.currency };
  },

  /** Sum an array of Money values. All must share the same currency. */
  sum(values: readonly Money[], currency = DEFAULT_CURRENCY): Money {
    return values.reduce((acc, v) => MoneyUtils.add(acc, v), MoneyUtils.zero(currency));
  },
} as const;

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}
