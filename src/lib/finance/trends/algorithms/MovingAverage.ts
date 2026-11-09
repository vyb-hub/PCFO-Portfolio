/**
 * Simple Moving Average — returns a series of length (n - windowSize + 1).
 * Returns empty array when windowSize > values.length or windowSize < 1.
 */
export function simpleMovingAverage(
  values: readonly number[],
  windowSize: number,
): readonly number[] {
  if (windowSize < 1 || values.length < windowSize) return [];

  const result: number[] = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    let sum = 0;
    for (let j = i; j < i + windowSize; j++) {
      sum += values[j]!;
    }
    result.push(sum / windowSize);
  }
  return result;
}

/**
 * Exponential Moving Average with configurable smoothing factor α ∈ (0, 1).
 * Returns a series of the same length as the input.
 */
export function exponentialMovingAverage(
  values: readonly number[],
  smoothingFactor = 0.3,
): readonly number[] {
  if (values.length === 0) return [];

  const result: number[] = [values[0]!];
  for (let i = 1; i < values.length; i++) {
    const prev = result[result.length - 1]!;
    result.push(smoothingFactor * values[i]! + (1 - smoothingFactor) * prev);
  }
  return result;
}
