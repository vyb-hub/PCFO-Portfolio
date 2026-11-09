import { describe, it, expect } from "vitest";
import {
  classifyDirection,
  classifyStrength,
  isHigherBetter,
} from "../../algorithms/TrendClassifier";
import { TrendDirection } from "../../TrendDirection";
import { TrendStrength } from "../../TrendStrength";
import type { MetricDefinition } from "../../../metrics/MetricDefinition";
import { MetricType, MetricUnit, CalculationFrequency } from "../../../metrics/MetricType";
import { MetricCategory } from "../../../metrics/MetricCategory";

function mockDef(style: "min-only" | "max-only" | "none"): MetricDefinition {
  return {
    id: MetricType.SAVINGS_RATE,
    name: "Test",
    description: "",
    category: MetricCategory.CASH_FLOW,
    unit: MetricUnit.PERCENTAGE,
    version: "1.0",
    calculationFrequency: CalculationFrequency.MONTHLY,
    threshold:
      style === "min-only"
        ? { min: 0.2, max: null, optimal: null, description: "" }
        : style === "max-only"
        ? { min: null, max: 0.5, optimal: null, description: "" }
        : null,
  };
}

describe("isHigherBetter", () => {
  it("min-only threshold → true (higher is better)", () => {
    expect(isHigherBetter(mockDef("min-only"))).toBe(true);
  });

  it("max-only threshold → false (lower is better)", () => {
    expect(isHigherBetter(mockDef("max-only"))).toBe(false);
  });

  it("no threshold → true (default convention)", () => {
    expect(isHigherBetter(mockDef("none"))).toBe(true);
  });
});

describe("classifyDirection", () => {
  it("CV ≥ 0.5 → VOLATILE regardless of slope", () => {
    expect(classifyDirection(0.5, true, 0.5)).toBe(TrendDirection.VOLATILE);
    expect(classifyDirection(-0.5, false, 0.7)).toBe(TrendDirection.VOLATILE);
    expect(classifyDirection(0.5, true, 0.99)).toBe(TrendDirection.VOLATILE);
  });

  it("small slope magnitude → STABLE", () => {
    expect(classifyDirection(0.01, true, 0)).toBe(TrendDirection.STABLE);
    expect(classifyDirection(-0.01, false, 0)).toBe(TrendDirection.STABLE);
  });

  it("positive slope + higherIsBetter=true → IMPROVING", () => {
    expect(classifyDirection(0.1, true, 0)).toBe(TrendDirection.IMPROVING);
  });

  it("positive slope + higherIsBetter=false → DECLINING", () => {
    expect(classifyDirection(0.1, false, 0)).toBe(TrendDirection.DECLINING);
  });

  it("negative slope + higherIsBetter=true → DECLINING", () => {
    expect(classifyDirection(-0.1, true, 0)).toBe(TrendDirection.DECLINING);
  });

  it("negative slope + higherIsBetter=false → IMPROVING", () => {
    expect(classifyDirection(-0.1, false, 0)).toBe(TrendDirection.IMPROVING);
  });

  it("CV exactly at threshold (0.50) → VOLATILE", () => {
    expect(classifyDirection(0.5, true, 0.50)).toBe(TrendDirection.VOLATILE);
  });

  it("CV just below threshold → direction-based classification", () => {
    expect(classifyDirection(0.1, true, 0.49)).toBe(TrendDirection.IMPROVING);
  });
});

describe("classifyStrength", () => {
  it("< 2% → NONE", () => {
    expect(classifyStrength(0.01)).toBe(TrendStrength.NONE);
    expect(classifyStrength(0)).toBe(TrendStrength.NONE);
  });

  it("2-5% → WEAK", () => {
    expect(classifyStrength(0.03)).toBe(TrendStrength.WEAK);
    expect(classifyStrength(0.049)).toBe(TrendStrength.WEAK);
  });

  it("5-10% → MODERATE", () => {
    expect(classifyStrength(0.06)).toBe(TrendStrength.MODERATE);
    expect(classifyStrength(0.099)).toBe(TrendStrength.MODERATE);
  });

  it(">= 10% → STRONG", () => {
    expect(classifyStrength(0.10)).toBe(TrendStrength.STRONG);
    expect(classifyStrength(0.5)).toBe(TrendStrength.STRONG);
  });
});
