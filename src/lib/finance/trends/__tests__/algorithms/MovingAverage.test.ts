import { describe, it, expect } from "vitest";
import { simpleMovingAverage, exponentialMovingAverage } from "../../algorithms/MovingAverage";

describe("simpleMovingAverage", () => {
  it("window=3 on 5-element series → 3 averages", () => {
    const r = simpleMovingAverage([1, 2, 3, 4, 5], 3);
    expect(r).toHaveLength(3);
    expect(r[0]).toBeCloseTo(2);
    expect(r[1]).toBeCloseTo(3);
    expect(r[2]).toBeCloseTo(4);
  });

  it("window=1 → returns all values unchanged", () => {
    expect(simpleMovingAverage([4, 5, 6], 1)).toEqual([4, 5, 6]);
  });

  it("window = series length → single mean value", () => {
    const r = simpleMovingAverage([2, 4, 6], 3);
    expect(r).toHaveLength(1);
    expect(r[0]).toBeCloseTo(4);
  });

  it("window > series length → empty array", () => {
    expect(simpleMovingAverage([1, 2], 3)).toHaveLength(0);
  });

  it("empty array → empty", () => {
    expect(simpleMovingAverage([], 3)).toHaveLength(0);
  });

  it("window=0 → empty", () => {
    expect(simpleMovingAverage([1, 2, 3], 0)).toHaveLength(0);
  });

  it("output length = n - windowSize + 1", () => {
    const r = simpleMovingAverage([1, 2, 3, 4, 5, 6], 4);
    expect(r).toHaveLength(3);
  });
});

describe("exponentialMovingAverage", () => {
  it("returns same length as input", () => {
    expect(exponentialMovingAverage([1, 2, 3, 4, 5])).toHaveLength(5);
  });

  it("first value equals first input", () => {
    const r = exponentialMovingAverage([10, 20, 30]);
    expect(r[0]).toBe(10);
  });

  it("empty array → empty", () => {
    expect(exponentialMovingAverage([])).toHaveLength(0);
  });

  it("monotonically increasing input → EMA increases each step", () => {
    const r = exponentialMovingAverage([1, 2, 3, 4, 5]);
    for (let i = 1; i < r.length; i++) {
      expect(r[i]!).toBeGreaterThan(r[i - 1]!);
    }
  });

  it("constant series → EMA is constant", () => {
    const r = exponentialMovingAverage([7, 7, 7, 7]);
    for (const v of r) expect(v).toBeCloseTo(7);
  });

  it("single element → returns single element", () => {
    expect(exponentialMovingAverage([42])).toEqual([42]);
  });
});
