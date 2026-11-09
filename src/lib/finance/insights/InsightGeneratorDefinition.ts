import type { InsightGeneratorType } from "./InsightGeneratorType";

/**
 * Static metadata describing an InsightGenerator.
 * Returned by InsightGenerator.definition().
 */
export interface InsightGeneratorDefinition {
  readonly id: InsightGeneratorType;
  readonly name: string;
  readonly description: string;
  readonly version: string;
}
