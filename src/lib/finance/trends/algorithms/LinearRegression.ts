export interface LinearRegressionResult {
  readonly slope: number;
  readonly intercept: number;
  readonly rSquared: number;
}

/**
 * OLS linear regression over an evenly-spaced index series x = 0, 1, …, n-1.
 * Returns slope, intercept, and R² (coefficient of determination).
 */
export function linearRegression(values: readonly number[]): LinearRegressionResult {
  const n = values.length;

  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };
  if (n === 1) return { slope: 0, intercept: values[0]!, rSquared: 1 };

  // Closed-form sums for x = 0, 1, …, n-1
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  let sumY = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    const y = values[i]!;
    sumY += y;
    sumXY += i * y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const y = values[i]!;
    ssTot += (y - yMean) ** 2;
    ssRes += (y - (slope * i + intercept)) ** 2;
  }

  const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, rSquared };
}
