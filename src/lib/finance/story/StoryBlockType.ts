/**
 * The specific kind of observation a StoryBlock narrates.
 *
 * One StoryBlockType maps to exactly one template in StoryTemplates.ts and
 * is produced by exactly one IStoryBlockGenerator. New block types are added
 * here as new generators are registered — never inferred at runtime.
 */
export enum StoryBlockType {
  LARGEST_EXPENSE = "LARGEST_EXPENSE",
}
