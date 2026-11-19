/**
 * Single source of truth for subscription plans.
 * Pure TypeScript (no browser or Node APIs): imported by both the server (tsx)
 * and the client (Vite).
 */

export type PlanTier = 'free' | 'extended' | 'pro';

export const PLAN_TIERS: readonly PlanTier[] = ['free', 'extended', 'pro'];

export const isPlanTier = (value: unknown): value is PlanTier =>
  typeof value === 'string' && (PLAN_TIERS as readonly string[]).includes(value);

/** Boolean capabilities. Some are not implemented in the app yet; they live here only. */
export type FeatureKey =
  | 'examMode'
  | 'contentAnalyzer'
  | 'googleSearch'
  | 'studyMetrics'
  | 'reinforcementRecs'
  | 'voiceTutor'
  | 'supportPersonalizedRecs';

/** Numeric limits. `null` means unlimited; `0` means not available. */
export interface PlanLimits {
  notebooksPerFolder: number | null;
  sourcesPerNotebook: number | null;
  infographicsPerDay: number | null;
  podcastsPerWeek: number | null;
  /** Maximum podcast length in minutes (0 when podcasts are unavailable). */
  podcastMaxMinutes: number;
}

export type SummaryProcessing = 'standard' | 'max';

export interface PlanDefinition {
  features: readonly FeatureKey[];
  limits: PlanLimits;
  summaryProcessing: SummaryProcessing;
}

export const PLAN_CONFIG: Record<PlanTier, PlanDefinition> = {
  free: {
    features: [],
    limits: {
      notebooksPerFolder: 30,
      sourcesPerNotebook: 40,
      infographicsPerDay: 5,
      podcastsPerWeek: 0,
      podcastMaxMinutes: 0,
    },
    summaryProcessing: 'standard',
  },
  extended: {
    features: ['reinforcementRecs'],
    limits: {
      notebooksPerFolder: 50,
      sourcesPerNotebook: 100,
      infographicsPerDay: 25,
      podcastsPerWeek: 3,
      podcastMaxMinutes: 20,
    },
    summaryProcessing: 'standard',
  },
  pro: {
    features: [
      'examMode',
      'contentAnalyzer',
      'googleSearch',
      'studyMetrics',
      'reinforcementRecs',
      'voiceTutor',
      'supportPersonalizedRecs',
    ],
    limits: {
      notebooksPerFolder: 70,
      sourcesPerNotebook: null,
      infographicsPerDay: 50,
      podcastsPerWeek: 50,
      podcastMaxMinutes: 45,
    },
    summaryProcessing: 'max',
  },
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Gratis',
  extended: 'Extended',
  pro: 'Pro',
};

export type BillingPeriod = 'monthly' | 'annual';

/** Prices in USD. Pro offers monthly and annual billing (annual is 33% off). */
export const PLAN_PRICES = {
  free: {monthly: 0, annual: 0},
  extended: {monthly: 2.99, annual: 2.99},
  pro: {monthly: 14.99, annual: 78.99},
} as const satisfies Record<PlanTier, Record<BillingPeriod, number>>;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  examMode: 'Modo examen realista',
  contentAnalyzer: 'Analizador de contenido',
  googleSearch: 'Búsqueda con Google',
  studyMetrics: 'Métricas de estudio',
  reinforcementRecs: 'Recomendaciones de refuerzo',
  voiceTutor: 'Tutor de voz',
  supportPersonalizedRecs: 'Soporte con recomendaciones personalizadas',
};

/** What a locked entry point can ask the plans page to explain: a feature or podcasts access. */
export type PlanNeed = FeatureKey | 'podcasts';

export const isPlanNeed = (value: unknown): value is PlanNeed =>
  value === 'podcasts' || (typeof value === 'string' && value in FEATURE_LABELS);

/** Cheapest tier (free < extended < pro) that unlocks `need`, or null if none does. */
export function cheapestTierFor(need: PlanNeed): PlanTier | null {
  return (
    PLAN_TIERS.find((tier) =>
      need === 'podcasts' ? PLAN_CONFIG[tier].limits.podcastsPerWeek !== 0 : PLAN_CONFIG[tier].features.includes(need),
    ) ?? null
  );
}

/** Quota kinds tracked server-side in `usage_counters`. */
export type QuotaKind = 'infographics' | 'podcasts';

export interface QuotaDefinition {
  period: 'day' | 'week';
  limit: (plan: PlanTier) => number | null;
}

export const QUOTAS: Record<QuotaKind, QuotaDefinition> = {
  infographics: {period: 'day', limit: (plan) => PLAN_CONFIG[plan].limits.infographicsPerDay},
  podcasts: {period: 'week', limit: (plan) => PLAN_CONFIG[plan].limits.podcastsPerWeek},
};

export function planHasFeature(plan: PlanTier, feature: FeatureKey): boolean {
  return PLAN_CONFIG[plan].features.includes(feature);
}

export function planLimit<K extends keyof PlanLimits>(plan: PlanTier, key: K): PlanLimits[K] {
  return PLAN_CONFIG[plan].limits[key];
}

/** True when `count` already reached a numeric limit (`null` = unlimited). */
export function isLimitReached(limit: number | null, count: number): boolean {
  return limit !== null && count >= limit;
}

/** Artifact types that consume a quota or need a feature (strings match `ArtifactType`). */
export const ARTIFACT_QUOTA: Record<string, QuotaKind | undefined> = {
  infografia: 'infographics',
  audio_podcast: 'podcasts',
};

export const ARTIFACT_FEATURE: Record<string, FeatureKey | undefined> = {
  modelo_examen: 'examMode',
};

/** Start of the current quota period as `YYYY-MM-DD` (UTC; weeks start on Monday). */
export function periodStart(period: 'day' | 'week', now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === 'week') {
    const offset = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - offset);
  }
  return d.toISOString().slice(0, 10);
}
