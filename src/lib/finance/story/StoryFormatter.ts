import type { Money } from "../types/Money";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/**
 * Pure, locale-independent formatting helpers shared by every
 * IStoryBlockGenerator and StoryTemplates function.
 *
 * Deliberately avoids Intl/toLocaleString for currency and date formatting —
 * those depend on the host ICU build and would make generated copy
 * non-deterministic across environments. Mirrors the discipline of
 * insights/generators/InsightBuilder.fmtValue.
 */
export const StoryFormatter = {
  currency(m: Money): string {
    const symbol = m.currency === "INR" ? "₹" : `${m.currency} `;
    const rounded = Math.round(Math.abs(m.amount));
    const sign = m.amount < 0 ? "-" : "";
    return `${sign}${symbol}${rounded.toLocaleString("en-IN")}`;
  },

  percent(fraction: number, digits = 0): string {
    return `${(fraction * 100).toFixed(digits)}%`;
  },

  multiple(factor: number): string {
    return `${factor.toFixed(1)}×`;
  },

  date(d: Date): string {
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  },
} as const;
