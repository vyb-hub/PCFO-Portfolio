/**
 * How urgently a StoryBlock deserves the user's attention, relative to
 * other blocks in the same FinancialStory.
 *
 * Mirrors RecommendationPriority's ordering (CRITICAL first) so the two
 * vocabularies stay mentally interchangeable across the platform.
 */
export enum StoryPriority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}
