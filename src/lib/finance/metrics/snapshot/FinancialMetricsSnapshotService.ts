import type { FinancialAggregate } from "../../aggregation/FinancialAggregate";
import type { IMetricsEngine } from "../IMetricsEngine";
import type { MetricEvaluation, MetricResult } from "../MetricResult";
import type { MetricType } from "../MetricType";
import { FinancialMetricsSnapshotBuilder } from "./FinancialMetricsSnapshotBuilder";
import type { FinancialMetricsSnapshot } from "./FinancialMetricsSnapshot";
import type { IFinancialMetricsSnapshotService } from "./IFinancialMetricsSnapshotService";
import type { SnapshotSummary } from "./SnapshotSummary";

/**
 * Concrete implementation of IFinancialMetricsSnapshotService.
 *
 * FinancialMetricsSnapshotService is the only class that knows about
 * both IMetricsEngine and FinancialMetricsSnapshotBuilder. It:
 *   1. Registers all known definitions upfront (from the engine registry)
 *   2. Iterates over every supported MetricType
 *   3. Calls engine.evaluate() — capturing both the result and health context
 *   4. Catches any error and records it as a MetricExecutionFailure
 *   5. Delegates assembly to FinancialMetricsSnapshotBuilder
 *
 * Adding a new MetricCalculator to the engine automatically includes it
 * in every subsequent snapshot — this service never needs to change.
 */
export class FinancialMetricsSnapshotService implements IFinancialMetricsSnapshotService {
  constructor(private readonly engine: IMetricsEngine) {}

  build(aggregate: FinancialAggregate): FinancialMetricsSnapshot {
    const builder = new FinancialMetricsSnapshotBuilder()
      .forUser(aggregate.userId)
      .forPeriod(aggregate.period)
      .fromAggregate(aggregate.aggregatedAt);

    for (const definition of this.engine.definitions()) {
      builder.withDefinition(definition);
    }

    for (const type of this.engine.supportedTypes()) {
      try {
        const evaluation = this.engine.evaluate(aggregate, type);
        builder.withResult(evaluation.result).withEvaluation(evaluation);
      } catch (err) {
        builder.withFailure({
          type,
          errorMessage: err instanceof Error ? err.message : String(err),
          failedAt: new Date(),
        });
      }
    }

    return builder.build();
  }

  summarise(snapshot: FinancialMetricsSnapshot): SnapshotSummary {
    return {
      userId: snapshot.userId,
      period: snapshot.period,
      generatedAt: snapshot.metadata.generatedAt,
      version: snapshot.metadata.version,
      totalMetrics: snapshot.metadata.totalAttempted,
      successfulMetrics: snapshot.metadata.successfulMetrics,
      failedMetrics: snapshot.metadata.failedMetrics,
      isComplete: snapshot.metadata.failedMetrics === 0,
    };
  }

  getResult(snapshot: FinancialMetricsSnapshot, type: MetricType): MetricResult | undefined {
    return snapshot.results.find((r) => r.type === type);
  }

  getEvaluation(snapshot: FinancialMetricsSnapshot, type: MetricType): MetricEvaluation | undefined {
    return snapshot.evaluations.find((e) => e.result.type === type);
  }

  hasMetric(snapshot: FinancialMetricsSnapshot, type: MetricType): boolean {
    return snapshot.results.some((r) => r.type === type);
  }
}
