import { describe, it, expect } from "vitest";
import { RecommendationEngine } from "../RecommendationEngine";
import { RecommendationRegistry } from "../RecommendationRegistry";
import { RecommendationPriority } from "../RecommendationPriority";
import { RecommendationGeneratorType } from "../RecommendationGeneratorType";
import { MetricType, MetricUnit } from "../../metrics/MetricType";
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
import type { FinancialMetricsSnapshot } from "../../metrics/snapshot/FinancialMetricsSnapshot";
import type { AnalyticsSnapshot } from "../../analytics/AnalyticsSnapshot";
import type { FinancialInsightSnapshot } from "../../insights/FinancialInsightSnapshot";
import type { RecommendationGenerator } from "../RecommendationGenerator";
import type { RecommendationGeneratorDefinition } from "../RecommendationGeneratorDefinition";
import type { Recommendation } from "../Recommendation";

const emptySnap = makeMetricsSnapshot("u1", []);
const emptyAnal = makeAnalyticsSnapshot("u1", []);
const emptyIns  = makeInsightSnapshot("u1", []);

class StubGenerator implements RecommendationGenerator {
  constructor(
    private readonly recId: string,
    private readonly priority: RecommendationPriority,
    private readonly type: RecommendationGeneratorType,
  ) {}

  definition(): RecommendationGeneratorDefinition {
    return { id: this.type, name: this.type, description: "", version: "1.0" };
  }

  generate(): ReadonlyArray<Recommendation> {
    return [{
      id:                    this.recId,
      category:              "SAVINGS" as any,
      priority:              this.priority,
      action:                "INCREASE_SAVINGS" as any,
      title:                 this.recId,
      rationale:             this.recId,
      impacts:               [],
      confidence:            "HIGH" as any,
      supportingInsightIds:  [],
      supportingFindingIds:  [],
      supportingMetricTypes: [],
      generatedAt:           new Date(),
    }];
  }
}

class ThrowingGenerator implements RecommendationGenerator {
  definition(): RecommendationGeneratorDefinition {
    return { id: RecommendationGeneratorType.SAVINGS, name: "Throwing", description: "", version: "1.0" };
  }
  generate(): ReadonlyArray<Recommendation> {
    throw new Error("deliberate test error");
  }
}

describe("RecommendationEngine — empty registry", () => {
  it("zero generators → empty snapshot with no failures", () => {
    const engine = new RecommendationEngine(new RecommendationRegistry());
    const snap = engine.generate(emptySnap, emptyAnal, emptyIns);
    expect(snap.recommendations).toHaveLength(0);
    expect(snap.failures).toHaveLength(0);
  });

  it("metadata userId matches metricsSnapshot userId", () => {
    const engine = new RecommendationEngine(new RecommendationRegistry());
    const snap = engine.generate(emptySnap, emptyAnal, emptyIns);
    expect(snap.userId).toBe("u1");
    expect(snap.metadata.userId).toBe("u1");
  });

  it("metadata.insightsGeneratedAt populated from insightSnapshot.generatedAt", () => {
    const engine = new RecommendationEngine(new RecommendationRegistry());
    const snap = engine.generate(emptySnap, emptyAnal, emptyIns);
    expect(snap.metadata.insightsGeneratedAt).toBeInstanceOf(Date);
  });
});

describe("RecommendationEngine — sorting", () => {
  it("recommendations sorted CRITICAL → HIGH → MEDIUM → LOW", () => {
    const registry = new RecommendationRegistry()
      .register(new StubGenerator("LOW_REC",      RecommendationPriority.LOW,      RecommendationGeneratorType.GOAL))
      .register(new StubGenerator("CRITICAL_REC", RecommendationPriority.CRITICAL, RecommendationGeneratorType.SAVINGS))
      .register(new StubGenerator("MEDIUM_REC",   RecommendationPriority.MEDIUM,   RecommendationGeneratorType.DEBT))
      .register(new StubGenerator("HIGH_REC",     RecommendationPriority.HIGH,     RecommendationGeneratorType.CASH_FLOW));

    const engine = new RecommendationEngine(registry);
    const snap = engine.generate(emptySnap, emptyAnal, emptyIns);

    expect(snap.recommendations[0]!.priority).toBe(RecommendationPriority.CRITICAL);
    expect(snap.recommendations[1]!.priority).toBe(RecommendationPriority.HIGH);
    expect(snap.recommendations[2]!.priority).toBe(RecommendationPriority.MEDIUM);
    expect(snap.recommendations[3]!.priority).toBe(RecommendationPriority.LOW);
  });
});

describe("RecommendationEngine — failure isolation", () => {
  it("throwing generator captured in failures, other generators still run", () => {
    const registry = new RecommendationRegistry()
      .register(new ThrowingGenerator())
      .register(new StubGenerator("GOOD_REC", RecommendationPriority.HIGH, RecommendationGeneratorType.DEBT));

    const engine = new RecommendationEngine(registry);
    const snap = engine.generate(emptySnap, emptyAnal, emptyIns);

    expect(snap.failures).toHaveLength(1);
    expect(snap.failures[0]!.errorMessage).toBe("deliberate test error");
    expect(snap.recommendations).toHaveLength(1);
    expect(snap.recommendations[0]!.id).toBe("GOOD_REC");
  });
});

describe("RecommendationEngine — metadata counts", () => {
  it("counts by priority match recommendation breakdown", () => {
    const registry = new RecommendationRegistry()
      .register(new StubGenerator("C1", RecommendationPriority.CRITICAL, RecommendationGeneratorType.SAVINGS))
      .register(new StubGenerator("C2", RecommendationPriority.CRITICAL, RecommendationGeneratorType.DEBT))
      .register(new StubGenerator("H1", RecommendationPriority.HIGH,     RecommendationGeneratorType.CASH_FLOW));

    const engine = new RecommendationEngine(registry);
    const snap = engine.generate(emptySnap, emptyAnal, emptyIns);

    expect(snap.metadata.criticalRecommendations).toBe(2);
    expect(snap.metadata.highRecommendations).toBe(1);
    expect(snap.metadata.mediumRecommendations).toBe(0);
    expect(snap.metadata.lowRecommendations).toBe(0);
    expect(snap.metadata.totalRecommendations).toBe(3);
    expect(snap.metadata.generatorsRun).toBe(3);
  });
});

describe("RecommendationEngine — registeredGenerators", () => {
  it("returns the generator type IDs of all registered generators", () => {
    const registry = new RecommendationRegistry()
      .register(new StubGenerator("R1", RecommendationPriority.HIGH, RecommendationGeneratorType.SAVINGS))
      .register(new StubGenerator("R2", RecommendationPriority.HIGH, RecommendationGeneratorType.DEBT));

    const engine = new RecommendationEngine(registry);
    expect(engine.registeredGenerators()).toContain(RecommendationGeneratorType.SAVINGS);
    expect(engine.registeredGenerators()).toContain(RecommendationGeneratorType.DEBT);
  });
});
