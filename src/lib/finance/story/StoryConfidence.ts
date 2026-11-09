/**
 * Qualitative confidence tier for a StoryBlock.
 *
 * Story generators typically derive this from a numeric confidence already
 * present on an upstream FinancialInsight or AnalyticsFinding via
 * toStoryConfidence() below. When a block is built purely from raw
 * FinancialAggregate facts (no upstream statistical confidence exists,
 * e.g. "largest expense this month"), the generator asserts HIGH directly —
 * the fact is a direct read of a transaction, not an inference.
 */
export enum StoryConfidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

/**
 * Map a 0.0-1.0 numeric confidence to a qualitative tier.
 *
 * Same >=0.70 / >=0.40 thresholds RecommendationConfidence mapping uses
 * inline (see LifestyleRecommendationGenerator, SavingsRecommendationGenerator)
 * — kept consistent rather than inventing a new calibration.
 */
export function toStoryConfidence(numeric: number): StoryConfidence {
  if (numeric >= 0.70) return StoryConfidence.HIGH;
  if (numeric >= 0.40) return StoryConfidence.MEDIUM;
  return StoryConfidence.LOW;
}
