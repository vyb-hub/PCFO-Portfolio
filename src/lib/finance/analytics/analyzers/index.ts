import { AnalyticsRegistry } from "../AnalyticsRegistry";
import { AnalyticsEngine } from "../AnalyticsEngine";
import type { IAnalyticsEngine } from "../IAnalyticsEngine";

import { TrendAnalyzer }       from "./TrendAnalyzer";
import { VarianceAnalyzer }    from "./VarianceAnalyzer";
import { SeasonalityAnalyzer } from "./SeasonalityAnalyzer";
import { BehaviourAnalyzer }   from "./BehaviourAnalyzer";
import { GoalProgressAnalyzer } from "./GoalProgressAnalyzer";
import { RiskAnalyzer }        from "./RiskAnalyzer";

export {
  TrendAnalyzer,
  VarianceAnalyzer,
  SeasonalityAnalyzer,
  BehaviourAnalyzer,
  GoalProgressAnalyzer,
  RiskAnalyzer,
};

/**
 * The sole wiring point for the default Analytics Platform.
 *
 * Adding a new analyzer = implement AnalyticsAnalyzer + register it here.
 * The AnalyticsEngine never needs to change.
 */
export function createDefaultAnalyticsEngine(): IAnalyticsEngine {
  const registry = new AnalyticsRegistry()
    .register(new TrendAnalyzer())
    .register(new VarianceAnalyzer())
    .register(new SeasonalityAnalyzer())
    .register(new BehaviourAnalyzer())
    .register(new GoalProgressAnalyzer())
    .register(new RiskAnalyzer());

  return new AnalyticsEngine(registry);
}
