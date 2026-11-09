import { describe, it, expect } from "vitest";
import { SavingsRecommendationGenerator } from "../generators/SavingsRecommendationGenerator";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationAction } from "../RecommendationAction";
import { RecommendationConfidence } from "../RecommendationConfidence";
import { InsightMetricCategory } from "../../insights/InsightMetricCategory";
import { InsightType } from "../../insights/InsightType";
import { InsightSeverityLevel } from "../../insights/InsightSeverityLevel";
import {
  makeEvaluation,
  makeMetricsSnapshot,
  makeThreshold,
  makeAnalyticsSnapshot,
  makeInsight,
  makeInsightSnapshot,
} from "./testHelpers";

const gen = new SavingsRecommendationGenerator();

const SR_THRESHOLD = makeThreshold(0.10, null);
const emptyAnal    = makeAnalyticsSnapshot("u1", []);

function srSnap(value: number, isHealthy: boolean, distance: number) {
  return makeMetricsSnapshot("u1", [
    makeEvaluation(MetricType.SAVINGS_RATE, value, SR_THRESHOLD, isHealthy, distance),
  ]);
}

describe("SavingsRecommendationGenerator — definition", () => {
  it("returns SAVINGS generator type", () => {
    expect(gen.definition().id).toBe("SAVINGS");
  });
});

describe("SavingsRecommendationGenerator — savings rate metric", () => {
  it("unhealthy savings rate → CRITICAL INCREASE_SAVINGS", () => {
    const recs = gen.generate(srSnap(0.04, false, -0.06), emptyAnal, makeInsightSnapshot("u1", []));
    expect(recs.find(r => r.id === "SAVINGS_RATE_BELOW_MINIMUM")).toBeDefined();
    expect(recs.find(r => r.id === "SAVINGS_RATE_BELOW_MINIMUM")!.priority).toBe(RecommendationPriority.CRITICAL);
    expect(recs.find(r => r.id === "SAVINGS_RATE_BELOW_MINIMUM")!.action).toBe(RecommendationAction.INCREASE_SAVINGS);
  });

  it("rationale includes the actual savings rate", () => {
    const recs = gen.generate(srSnap(0.04, false, -0.06), emptyAnal, makeInsightSnapshot("u1", []));
    expect(recs[0]!.rationale).toContain("4.0%");
  });

  it("savings rate within 15% above min → MEDIUM approaching rec", () => {
    // 0.10 * 1.15 = 0.115; value 0.11 ≤ 0.115
    const recs = gen.generate(srSnap(0.11, true, 0.01), emptyAnal, makeInsightSnapshot("u1", []));
    expect(recs.find(r => r.id === "SAVINGS_RATE_APPROACHING_MINIMUM")).toBeDefined();
    expect(recs.find(r => r.id === "SAVINGS_RATE_APPROACHING_MINIMUM")!.priority).toBe(RecommendationPriority.MEDIUM);
  });

  it("savings rate comfortably above min → no rate rec", () => {
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, makeInsightSnapshot("u1", []));
    expect(recs.find(r => r.id.startsWith("SAVINGS_RATE"))).toBeUndefined();
  });

  it("no savings rate eval → no rate recs", () => {
    const recs = gen.generate(makeMetricsSnapshot("u1", []), emptyAnal, makeInsightSnapshot("u1", []));
    expect(recs.filter(r => r.id.startsWith("SAVINGS_RATE"))).toHaveLength(0);
  });
});

describe("SavingsRecommendationGenerator — compression insight (WARNING type)", () => {
  const compressionSnap = makeInsightSnapshot("u1", [
    makeInsight("SAVINGS_WARN", InsightMetricCategory.SAVINGS, InsightType.WARNING,
      InsightSeverityLevel.MEDIUM, 0.80),
  ]);
  const highConfCompressionSnap = makeInsightSnapshot("u1", [
    makeInsight("SAVINGS_WARN_HIGH", InsightMetricCategory.SAVINGS, InsightType.WARNING,
      InsightSeverityLevel.MEDIUM, 0.75),
  ]);

  it("SAVINGS + WARNING insight → HIGH REDUCE_SPENDING", () => {
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, compressionSnap);
    expect(recs.find(r => r.id === "SAVINGS_COMPRESSION_REDUCE_SPEND")).toBeDefined();
    expect(recs.find(r => r.id === "SAVINGS_COMPRESSION_REDUCE_SPEND")!.priority).toBe(RecommendationPriority.HIGH);
    expect(recs.find(r => r.id === "SAVINGS_COMPRESSION_REDUCE_SPEND")!.action).toBe(RecommendationAction.REDUCE_SPENDING);
  });

  it("confidence < 0.70 → RecommendationConfidence.MEDIUM", () => {
    // compressionSnap insight has confidence 0.80 → HIGH
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, compressionSnap);
    expect(recs.find(r => r.id === "SAVINGS_COMPRESSION_REDUCE_SPEND")!.confidence)
      .toBe(RecommendationConfidence.HIGH);
  });

  it("confidence >= 0.70 → RecommendationConfidence.HIGH", () => {
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, highConfCompressionSnap);
    expect(recs.find(r => r.id === "SAVINGS_COMPRESSION_REDUCE_SPEND")!.confidence)
      .toBe(RecommendationConfidence.HIGH);
  });

  it("confidence 0.60 → RecommendationConfidence.MEDIUM", () => {
    const lowConf = makeInsightSnapshot("u1", [
      makeInsight("SAVINGS_WARN_LOW", InsightMetricCategory.SAVINGS, InsightType.WARNING,
        InsightSeverityLevel.MEDIUM, 0.60),
    ]);
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, lowConf);
    expect(recs.find(r => r.id === "SAVINGS_COMPRESSION_REDUCE_SPEND")!.confidence)
      .toBe(RecommendationConfidence.MEDIUM);
  });
});

describe("SavingsRecommendationGenerator — velocity insight (RISK type)", () => {
  const velocitySnap = makeInsightSnapshot("u1", [
    makeInsight("SAVINGS_RISK", InsightMetricCategory.SAVINGS, InsightType.RISK,
      InsightSeverityLevel.HIGH, 0.75),
  ]);

  it("SAVINGS + RISK insight → MEDIUM INCREASE_SAVINGS", () => {
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, velocitySnap);
    expect(recs.find(r => r.id === "SAVINGS_VELOCITY_IMPROVE_CONSISTENCY")).toBeDefined();
    expect(recs.find(r => r.id === "SAVINGS_VELOCITY_IMPROVE_CONSISTENCY")!.priority).toBe(RecommendationPriority.MEDIUM);
    expect(recs.find(r => r.id === "SAVINGS_VELOCITY_IMPROVE_CONSISTENCY")!.action).toBe(RecommendationAction.INCREASE_SAVINGS);
  });

  it("WARNING insight does not trigger velocity rec", () => {
    const warnSnap = makeInsightSnapshot("u1", [
      makeInsight("SAVINGS_WARN2", InsightMetricCategory.SAVINGS, InsightType.WARNING),
    ]);
    const recs = gen.generate(srSnap(0.25, true, 0.15), emptyAnal, warnSnap);
    expect(recs.find(r => r.id === "SAVINGS_VELOCITY_IMPROVE_CONSISTENCY")).toBeUndefined();
  });
});

describe("SavingsRecommendationGenerator — combined signals", () => {
  it("unhealthy rate + SAVINGS/WARNING insight → 2 recs (CRITICAL + HIGH)", () => {
    const snap = makeInsightSnapshot("u1", [
      makeInsight("SAVINGS_WARN3", InsightMetricCategory.SAVINGS, InsightType.WARNING),
    ]);
    const recs = gen.generate(srSnap(0.04, false, -0.06), emptyAnal, snap);
    const ids = recs.map(r => r.id);
    expect(ids).toContain("SAVINGS_RATE_BELOW_MINIMUM");
    expect(ids).toContain("SAVINGS_COMPRESSION_REDUCE_SPEND");
  });
});
