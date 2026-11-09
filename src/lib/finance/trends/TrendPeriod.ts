/**
 * Describes the time window covered by a TrendReport.
 */
export interface TrendPeriod {
  readonly firstPeriodLabel: string;
  readonly lastPeriodLabel: string;
  readonly periodsAnalyzed: number;
  readonly windowLabel: string;
}

export function buildTrendPeriod(
  firstPeriodLabel: string,
  lastPeriodLabel: string,
  periodsAnalyzed: number,
): TrendPeriod {
  return {
    firstPeriodLabel,
    lastPeriodLabel,
    periodsAnalyzed,
    windowLabel: computeWindowLabel(periodsAnalyzed),
  };
}

function computeWindowLabel(periods: number): string {
  if (periods <= 2) return "short";
  if (periods <= 12) return `${periods}P`;
  return "12P+";
}
