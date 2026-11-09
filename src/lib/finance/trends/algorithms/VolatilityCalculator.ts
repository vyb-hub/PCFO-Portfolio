export interface VolatilityResult {
  readonly standardDeviation: number;
  /** Population CV = stddev / |mean|. 0 when mean is 0. */
  readonly coefficientOfVariation: number;
  readonly range: number;
}

/**
 * Computes population standard deviation, CV, and range for a value series.
 */
export function calculateVolatility(values: readonly number[]): VolatilityResult {
  if (values.length <= 1) {
    return { standardDeviation: 0, coefficientOfVariation: 0, range: 0 };
  }

  let min = values[0]!;
  let max = values[0]!;
  let sum = 0;

  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  const mean = sum / values.length;

  let varianceSum = 0;
  for (const v of values) {
    varianceSum += (v - mean) ** 2;
  }

  const stdDev = Math.sqrt(varianceSum / values.length);
  const cv = mean !== 0 ? stdDev / Math.abs(mean) : 0;

  return {
    standardDeviation: stdDev,
    coefficientOfVariation: cv,
    range: max - min,
  };
}
