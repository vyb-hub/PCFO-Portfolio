import type { RecommendationGeneratorType } from "./RecommendationGeneratorType";

/**
 * Static metadata describing a RecommendationGenerator.
 * Returned by RecommendationGenerator.definition().
 */
export interface RecommendationGeneratorDefinition {
  readonly id: RecommendationGeneratorType;
  readonly name: string;
  readonly description: string;
  readonly version: string;
}
