/**
 * Qualitative confidence tier for an insight.
 *
 * Derived from the underlying AnalyticsFinding.confidence score:
 *   HIGH   >= 0.75
 *   MEDIUM >= 0.50
 *   LOW    < 0.50
 *
 * Downstream consumers (AI Coach, Recommendation Engine) use this to
 * calibrate how confidently to present or act on an insight.
 */
export enum InsightConfidence {
  HIGH   = "HIGH",
  MEDIUM = "MEDIUM",
  LOW    = "LOW",
}

export function toInsightConfidence(score: number): InsightConfidence {
  if (score >= 0.75) return InsightConfidence.HIGH;
  if (score >= 0.50) return InsightConfidence.MEDIUM;
  return InsightConfidence.LOW;
}
