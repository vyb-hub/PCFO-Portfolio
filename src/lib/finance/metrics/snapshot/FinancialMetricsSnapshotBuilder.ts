import type { AggregatePeriod } from "../../aggregation/AggregatePeriod";
import type { MetricDefinition } from "../MetricDefinition";
import type { MetricResult, MetricEvaluation } from "../MetricResult";
import type { FinancialMetricsSnapshot, MetricExecutionFailure } from "./FinancialMetricsSnapshot";
import type { SnapshotMetadata } from "./SnapshotMetadata";
import type { SnapshotVersion } from "./SnapshotVersion";
import { CURRENT_SNAPSHOT_VERSION } from "./SnapshotVersion";

/**
 * Constructs a FinancialMetricsSnapshot from its constituent parts.
 *
 * Used by FinancialMetricsSnapshotService after executing all metric
 * calculations. Also used directly in tests to build snapshots with
 * precise contents without running the full engine.
 *
 * All arrays are frozen at build() time — the resulting snapshot is
 * fully immutable from the moment it is returned.
 */
export class FinancialMetricsSnapshotBuilder {
  private _userId = "";
  private _period: AggregatePeriod | null = null;
  private _aggregatedAt: Date | null = null;
  private _generatedAt: Date | null = null;
  private _version: SnapshotVersion = CURRENT_SNAPSHOT_VERSION;

  private readonly _results: MetricResult[] = [];
  private readonly _evaluations: MetricEvaluation[] = [];
  private readonly _failures: MetricExecutionFailure[] = [];
  private readonly _definitions: MetricDefinition[] = [];

  forUser(userId: string): this {
    this._userId = userId;
    return this;
  }

  forPeriod(period: AggregatePeriod): this {
    this._period = period;
    return this;
  }

  fromAggregate(aggregatedAt: Date): this {
    this._aggregatedAt = aggregatedAt;
    return this;
  }

  generatedAt(date: Date): this {
    this._generatedAt = date;
    return this;
  }

  atVersion(version: SnapshotVersion): this {
    this._version = version;
    return this;
  }

  withResult(result: MetricResult): this {
    this._results.push(result);
    return this;
  }

  withEvaluation(evaluation: MetricEvaluation): this {
    this._evaluations.push(evaluation);
    return this;
  }

  withFailure(failure: MetricExecutionFailure): this {
    this._failures.push(failure);
    return this;
  }

  withDefinition(definition: MetricDefinition): this {
    this._definitions.push(definition);
    return this;
  }

  build(): FinancialMetricsSnapshot {
    if (!this._userId) throw new Error("FinancialMetricsSnapshotBuilder: userId is required");
    if (!this._period) throw new Error("FinancialMetricsSnapshotBuilder: period is required");
    if (!this._aggregatedAt) throw new Error("FinancialMetricsSnapshotBuilder: aggregatedAt is required");

    const generatedAt = this._generatedAt ?? new Date();

    const metadata: SnapshotMetadata = {
      userId: this._userId,
      generatedAt,
      aggregatedAt: this._aggregatedAt,
      version: this._version,
      totalAttempted: this._results.length + this._failures.length,
      successfulMetrics: this._results.length,
      failedMetrics: this._failures.length,
    };

    return Object.freeze({
      userId: this._userId,
      period: this._period,
      metadata,
      results:     Object.freeze([...this._results]),
      evaluations: Object.freeze([...this._evaluations]),
      failures:    Object.freeze([...this._failures]),
      definitions: Object.freeze([...this._definitions]),
    });
  }
}
