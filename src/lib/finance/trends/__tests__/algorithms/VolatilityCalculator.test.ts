import { describe, it, expect } from "vitest";
import { calculateVolatility } from "../../algorithms/VolatilityCalculator";

describe("calculateVolatility", () => {
  it("constant series → all zeros", () => {
    const r = calculateVolatility([5, 5, 5, 5]);
    expect(r.standardDeviation).toBe(0);
    expect(r.coefficientOfVariation).toBe(0);
    expect(r.range).toBe(0);
  });

  it("single element → all zeros", () => {
    const r = calculateVolatility([10]);
    expect(r.standardDeviation).toBe(0);
    expect(r.coefficientOfVariation).toBe(0);
    expect(r.range).toBe(0);
  });

  it("empty array → all zeros", () => {
    const r = calculateVolatility([]);
    expect(r.standardDeviation).toBe(0);
    expect(r.coefficientOfVariation).toBe(0);
  });

  it("known variance: [2,4,6,8,10] → mean=6, population stddev=2.83", () => {
    const r = calculateVolatility([2, 4, 6, 8, 10]);
    const mean = 6;
    const expectedStdDev = Math.sqrt(8);  // population variance = 8
    expect(r.standardDeviation).toBeCloseTo(expectedStdDev);
    expect(r.coefficientOfVariation).toBeCloseTo(expectedStdDev / mean);
  });

  it("range = max − min", () => {
    const r = calculateVolatility([3, 7, 1, 9, 5]);
    expect(r.range).toBeCloseTo(8);
  });

  it("negative values: CV uses |mean|, remains non-negative", () => {
    const r = calculateVolatility([-10, -8, -12]);
    expect(r.coefficientOfVariation).toBeGreaterThanOrEqual(0);
    expect(r.standardDeviation).toBeGreaterThan(0);
  });

  it("high-variance series has higher CV than low-variance series", () => {
    const low  = calculateVolatility([10, 11, 10, 11]);
    const high = calculateVolatility([2, 20, 1, 30]);
    expect(high.coefficientOfVariation).toBeGreaterThan(low.coefficientOfVariation);
  });

  it("two points → correct range", () => {
    const r = calculateVolatility([3, 9]);
    expect(r.range).toBeCloseTo(6);
  });
});
