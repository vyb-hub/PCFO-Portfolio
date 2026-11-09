// Enums
export { TrendDirection } from "./TrendDirection";
export { TrendStrength } from "./TrendStrength";
export { TrendComparisonSummary } from "./TrendComparison";

// Value objects and types
export type { TrendDataPoint } from "./TrendDataPoint";
export type { TrendPeriod } from "./TrendPeriod";
export type { TrendStats } from "./TrendStats";
export type { MetricTrendResult } from "./MetricTrendResult";
export type { TrendReport, TrendAnalysisFailure, TrendReportMetadata } from "./TrendReport";
export type { TrendComparison } from "./TrendComparison";

// Interfaces
export type { ITrendAnalyzer } from "./ITrendAnalyzer";
export type { ITrendEngine } from "./ITrendEngine";
export type { ITrendService } from "./ITrendService";

// Implementations
export { TrendAnalyzerRegistry } from "./TrendAnalyzerRegistry";
export { TrendEngine } from "./TrendEngine";
export { TrendService } from "./TrendService";

// Algorithms (exported for testing and custom analyzer authors)
export { linearRegression } from "./algorithms/LinearRegression";
export type { LinearRegressionResult } from "./algorithms/LinearRegression";
export { simpleMovingAverage, exponentialMovingAverage } from "./algorithms/MovingAverage";
export { calculateVolatility } from "./algorithms/VolatilityCalculator";
export type { VolatilityResult } from "./algorithms/VolatilityCalculator";
export { isHigherBetter, classifyDirection, classifyStrength } from "./algorithms/TrendClassifier";

// Default implementations
export { DefaultMetricTrendAnalyzer } from "./analyzers/DefaultMetricTrendAnalyzer";
export { createDefaultTrendEngine, createDefaultTrendService } from "./analyzers/index";

// Extension points
export type { ISeasonalityDetector, SeasonalityPattern } from "./extensions/ISeasonalityDetector";
export type { IOutlierDetector, OutlierResult } from "./extensions/IOutlierDetector";
export type { IChangePointDetector, ChangePoint } from "./extensions/IChangePointDetector";
export type { IForecaster, ForecastPoint } from "./extensions/IForecaster";

// Helpers
export { buildTrendPeriod } from "./TrendPeriod";
export { buildTrendComparison } from "./TrendComparison";
