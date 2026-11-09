/**
 * Stable identifier for a registered IStoryBlockGenerator.
 * One value per generator, independent of StoryCategory (a category may
 * eventually have more than one generator contributing blocks to it).
 */
export enum StoryBlockGeneratorType {
  CASH_FLOW_LARGEST_EXPENSE = "CASH_FLOW_LARGEST_EXPENSE",
}
