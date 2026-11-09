/**
 * Qualitative confidence tier for a recommendation.
 *
 * HIGH   — derived from CRITICAL insights with HIGH confidence analytics evidence
 * MEDIUM — derived from WARNING insights or mixed confidence signals
 * LOW    — derived from INFO insights or limited supporting evidence
 *
 * Downstream consumers (AI Coach) use this to calibrate how confidently
 * to present and how strongly to follow up on a recommendation.
 */
export enum RecommendationConfidence {
  HIGH   = "HIGH",
  MEDIUM = "MEDIUM",
  LOW    = "LOW",
}
