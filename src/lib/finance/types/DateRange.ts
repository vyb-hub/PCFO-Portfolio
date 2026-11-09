/**
 * Represents an inclusive date range.
 */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/** Helper type to build a DateRange from two dates */
export type MakeDateRange = (start: Date, end: Date) => DateRange;

/** Helper type to check if a date falls within a range */
export type DateInRange = (date: Date, range: DateRange) => boolean;

/** Helper type to compute overlap between two ranges */
export type DateRangeOverlap = (a: DateRange, b: DateRange) => DateRange | null;
