import {
  FEATURE_LABELS,
  PLAN_CONFIG,
  PLAN_PRICES,
  type BillingPeriod,
  type FeatureKey,
  type PlanNeed,
  type PlanTier,
} from '../../config/plans';

const usd = new Intl.NumberFormat('es', {style: 'currency', currency: 'USD'});

/** Short names for what the user tried to use (matches the tile/screen names where they differ). */
export const NEED_LABELS: Record<PlanNeed, string> = {
  ...FEATURE_LABELS,
  examMode: 'Modelo de examen',
  podcasts: 'Podcasts',
};

export const formatUsd = (value: number) => usd.format(value);

/** "US$ 14,99 / mes", "Gratis", ... for a tier and billing period. */
export function priceLabel(tier: PlanTier, period: BillingPeriod): string {
  if (tier === 'free') return 'Gratis';
  const value = PLAN_PRICES[tier][period];
  if (tier === 'pro' && period === 'annual') return `${formatUsd(value)} / año`;
  return `${formatUsd(value)} / mes`;
}

const limitText = (value: number | null, unit: string) => (value === null ? `${unit} ilimitadas` : `${value} ${unit}`);

/** Human-readable bullet list of what a tier includes, derived from the plan config. */
export function planHighlights(tier: PlanTier): string[] {
  const {limits, features, summaryProcessing} = PLAN_CONFIG[tier];
  const items = [
    `${limitText(limits.notebooksPerFolder, 'cuadernos')} por carpeta`,
    `${limitText(limits.sourcesPerNotebook, 'fuentes')} por cuaderno`,
    `${limits.infographicsPerDay} infografías por día`,
    limits.podcastsPerWeek
      ? `${limits.podcastsPerWeek} podcasts por semana (hasta ${limits.podcastMaxMinutes} min)`
      : 'Sin podcasts',
    summaryProcessing === 'max' ? 'Procesamiento máximo de resúmenes' : 'Procesamiento estándar de resúmenes',
  ];
  const order: FeatureKey[] = [
    'examMode',
    'contentAnalyzer',
    'googleSearch',
    'studyMetrics',
    'reinforcementRecs',
    'voiceTutor',
    'supportPersonalizedRecs',
  ];
  for (const feature of order) if (features.includes(feature)) items.push(FEATURE_LABELS[feature]);
  return items;
}
