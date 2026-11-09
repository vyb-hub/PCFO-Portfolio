import type { FinancialInsight } from "../FinancialInsight";

/**
 * Extension point: translate or adapt FinancialInsight text fields into
 * a target locale or regional convention.
 *
 * Implementations may swap currency symbols, format numbers for the
 * locale, or translate title/summary/details strings.
 */
export interface IInsightLocalizer {
  /**
   * Return a copy of `insight` with text fields adapted for the given
   * locale string (IETF BCP 47, e.g. "en-GB", "hi-IN").
   * The `id`, `metric`, `category`, `type`, `severity`, and statistical
   * fields MUST remain unchanged.
   */
  localize(insight: FinancialInsight, locale: string): FinancialInsight;

  /**
   * Return the list of locale codes this localizer supports.
   * An empty array means all locales are accepted (e.g. a pass-through).
   */
  supportedLocales(): ReadonlyArray<string>;
}
