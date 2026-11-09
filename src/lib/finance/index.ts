/**
 * Financial Intelligence Layer — public API.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                   Dependency Graph (one-way)                    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  types/          Shared primitives: Money, DateRange, Frequency │
 * │  utils/          Pure helpers: MoneyUtils, DateUtils            │
 * │       ↓                                                         │
 * │  ITransactionRepository   Port to the ingestion layer           │
 * │       ↓                                                         │
 * │  cashflow / debt / goals / investments   Core domain models     │
 * │       ↓                                                         │
 * │  aggregation/    FinancialAggregate — single source for metrics │
 * │       ↓                                                         │
 * │  metrics/        Calculators + MetricsEngine (plugin arch.)    │
 * │       ↓                                                         │
 * │  metrics/snapshot/ FinancialMetricsSnapshot — canonical state  │
 * │       ↓                                                         │
 * │  analytics/      Plugin analyzers → AnalyticsSnapshot          │
 * │       ↓                                                         │
 * │  insights/       Plugin generators → InsightSnapshot            │
 * │       ↓                                                         │
 * │  recommendations/ Typed, prioritised action suggestions         │
 * │       ↓                                                         │
 * │  FinancialDomain/ Facade + future orchestration contracts       │
 * │       ↓                                                         │
 * │  coach/          AI Coach: consumes the full pipeline           │
 * │       ↓                                                         │
 * │  memory/         RAG layer: stores and recalls financial context│
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import type { FinancialSnapshot, IFinancialDomain } from "@/lib/finance";
 *   import type { IMetricsService, MetricType } from "@/lib/finance";
 *   import { MoneyUtils, DateUtils } from "@/lib/finance";
 */

// Shared primitives, enums, and the ingestion boundary port
export * from "./types";

// Pure utility helpers (no domain dependencies)
export * from "./utils";

// Core domain models and service contracts
export * from "./cashflow";
export * from "./debt";
export * from "./goals";
export * from "./investments";

// Aggregation layer — consolidates domain data into a single immutable FinancialAggregate
// All downstream layers (metrics, analytics, insights) consume FinancialAggregate
export * from "./aggregation";

// Metrics layer — calculators, engine, registry, and snapshot platform
// metrics/snapshot/ is re-exported as part of this barrel
export * from "./metrics";

// Analytics Platform — plugin analyzers, AnalyticsEngine, AnalyticsSnapshot
// analytics/history/ (ISnapshotHistoryProvider) is intentionally NOT re-exported
export * from "./analytics";

// Intelligence layers
export * from "./insights";
export * from "./recommendations";

// Orchestration facade and future feature contracts
export * from "./FinancialDomain";

// Upstream AI consumers
export * from "./coach";
export * from "./memory";
