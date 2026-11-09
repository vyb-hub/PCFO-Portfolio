import { describe, it, expect } from "vitest";
import { linearRegression } from "../../algorithms/LinearRegression";

describe("linearRegression", () => {
  it("perfect increasing series → slope = 1, R² = 1", () => {
    const r = linearRegression([1, 2, 3, 4, 5]);
    expect(r.slope).toBeCloseTo(1);
    expect(r.intercept).toBeCloseTo(1);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it("perfect decreasing series → slope = -1, R² = 1", () => {
    const r = linearRegression([5, 4, 3, 2, 1]);
    expect(r.slope).toBeCloseTo(-1);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it("flat series → slope = 0, R² = 1 (all points on the regression line)", () => {
    const r = linearRegression([3, 3, 3, 3]);
    expect(r.slope).toBeCloseTo(0);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it("two points → slope = rise between them, R² = 1", () => {
    const r = linearRegression([2, 4]);
    expect(r.slope).toBeCloseTo(2);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it("single point → slope = 0, intercept = value", () => {
    const r = linearRegression([5]);
    expect(r.slope).toBe(0);
    expect(r.intercept).toBe(5);
    expect(r.rSquared).toBe(1);
  });

  it("empty array → all zeros", () => {
    const r = linearRegression([]);
    expect(r.slope).toBe(0);
    expect(r.intercept).toBe(0);
    expect(r.rSquared).toBe(0);
  });

  it("noisy upward series → positive slope, R² < 1", () => {
    const r = linearRegression([1, 3, 2, 5, 4, 7]);
    expect(r.slope).toBeGreaterThan(0);
    expect(r.rSquared).toBeGreaterThan(0);
    expect(r.rSquared).toBeLessThan(1);
  });

  it("negative values → regression works correctly", () => {
    const r = linearRegression([-5, -4, -3, -2, -1]);
    expect(r.slope).toBeCloseTo(1);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it("large series (100 values) → processes without error", () => {
    const values = Array.from({ length: 100 }, (_, i) => i * 2 + 1);
    const r = linearRegression(values);
    expect(r.slope).toBeCloseTo(2);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it("R² is bounded in [0, 1] for noisy data", () => {
    const r = linearRegression([10, 1, 10, 1, 10, 1]);
    expect(r.rSquared).toBeGreaterThanOrEqual(0);
    expect(r.rSquared).toBeLessThanOrEqual(1);
  });
});
