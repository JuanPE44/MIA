import {useAppState} from '../../app/AppStateContext';
import {
  isLimitReached,
  planHasFeature,
  planLimit,
  type FeatureKey,
  type PlanLimits,
  type PlanTier,
} from '../../config/plans';

export interface PlanApi {
  plan: PlanTier;
  can: (feature: FeatureKey) => boolean;
  limit: <K extends keyof PlanLimits>(key: K) => PlanLimits[K];
  /** True when `count` already reached the plan's numeric limit for `key` (`null` = unlimited). */
  reached: (key: 'notebooksPerFolder' | 'sourcesPerNotebook', count: number) => boolean;
}

/** Current plan plus helpers to check feature access and count limits. */
export function usePlan(): PlanApi {
  const {plan} = useAppState();
  return {
    plan,
    can: (feature) => planHasFeature(plan, feature),
    limit: (key) => planLimit(plan, key),
    reached: (key, count) => isLimitReached(planLimit(plan, key), count),
  };
}
