/**
 * A user's risk tolerance category.
 */
export enum RiskProfile {
  CONSERVATIVE = "CONSERVATIVE",
  MODERATE = "MODERATE",
  AGGRESSIVE = "AGGRESSIVE",
}

/**
 * Numeric risk score on a 0–100 scale.
 * 0–33: conservative, 34–66: moderate, 67–100: aggressive.
 */
export type RiskScore = number;
