import type { DateRange } from "../types/DateRange";

export const DateUtils = {
  make(start: Date, end: Date): DateRange {
    return { start, end };
  },

  inRange(date: Date, range: DateRange): boolean {
    return date >= range.start && date <= range.end;
  },

  /** Returns the overlapping DateRange, or null if the ranges do not overlap. */
  overlap(a: DateRange, b: DateRange): DateRange | null {
    const start = a.start > b.start ? a.start : b.start;
    const end = a.end < b.end ? a.end : b.end;
    if (start > end) return null;
    return { start, end };
  },

  /** Inclusive range for the calendar month containing the given date. */
  monthOf(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  },

  /** Returns the last N complete calendar months, ending before the current month. */
  lastNMonths(n: number, from: Date): DateRange {
    const end = new Date(from.getFullYear(), from.getMonth(), 0, 23, 59, 59, 999);
    const start = new Date(from.getFullYear(), from.getMonth() - n, 1);
    return { start, end };
  },

  /** "2025-06" label for a given date. */
  monthLabel(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  },

  /** Number of days in a DateRange (inclusive). */
  lengthInDays(range: DateRange): number {
    const ms = range.end.getTime() - range.start.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  },
} as const;
