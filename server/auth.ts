import type {NextFunction, Request, RequestHandler, Response} from 'express';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {
  PLAN_CONFIG,
  QUOTAS,
  isPlanTier,
  periodStart,
  planHasFeature,
  type FeatureKey,
  type PlanTier,
  type QuotaKind,
} from '../src/config/plans.js';

export interface AuthUser {
  id: string;
  email: string | null;
  plan: PlanTier;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let admin: SupabaseClient | null | undefined;

/** Lazily-created service-role client; `null` when Supabase is not configured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  admin =
    url && key
      ? createClient(url, key, {auth: {autoRefreshToken: false, persistSession: false}})
      : null;
  return admin;
}

/** True on production / Vercel, where the anonymous dev fallback must never be used. */
export const isProductionRuntime = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

let warnedNoSupabase = false;

const DEV_USER: AuthUser = {id: 'dev-anonymous', email: null, plan: 'pro'};

/**
 * Validates the bearer token and loads the user's plan into `req.user`.
 * Without Supabase configured it logs a warning once and treats every request
 * as an anonymous 'pro' dev user, so the app keeps working locally.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (isProductionRuntime()) {
      return res.status(503).json({error: 'AUTH_NOT_CONFIGURED'});
    }
    if (!warnedNoSupabase) {
      warnedNoSupabase = true;
      console.warn(
        '[auth] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set: running without auth (anonymous "pro" dev user).',
      );
    }
    req.user = DEV_USER;
    return next();
  }

  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({error: 'Inicia sesión para continuar.', code: 'UNAUTHENTICATED'});
  }

  try {
    const {data, error} = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({error: 'Tu sesión expiró. Vuelve a iniciar sesión.', code: 'UNAUTHENTICATED'});
    }
    // Simulated billing: the client declares its plan (no real payment exists yet).
    const declared = req.headers['x-mia-plan'];
    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      plan: isPlanTier(declared) ? declared : 'free',
    };
    return next();
  } catch (err) {
    console.error('[auth] Could not validate session', err);
    return res.status(401).json({error: 'No se pudo validar tu sesión.', code: 'UNAUTHENTICATED'});
  }
};

export function featureLockedResponse(res: Response, feature: FeatureKey) {
  return res.status(403).json({
    error: 'Esta función no está incluida en tu plan.',
    code: 'PLAN_FEATURE_LOCKED',
    feature,
  });
}

export function quotaExceededResponse(res: Response, kind: QuotaKind) {
  return res.status(429).json({
    error:
      kind === 'infographics'
        ? 'Llegaste al límite diario de infografías de tu plan.'
        : 'Llegaste al límite semanal de podcasts de tu plan.',
    code: 'PLAN_QUOTA_EXCEEDED',
    quota: kind,
  });
}

/** Middleware: 403 unless the user's plan includes `feature`. */
export const requireFeature =
  (feature: FeatureKey): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const plan = req.user?.plan ?? 'free';
    if (!planHasFeature(plan, feature)) return featureLockedResponse(res, feature);
    next();
  };

/**
 * Consumes one unit of `kind` for the current user. Returns false when the
 * plan's limit for the current period is exhausted. With no Supabase (dev
 * fallback) nothing is tracked and the call always succeeds.
 */
export async function consumeQuota(user: AuthUser, kind: QuotaKind): Promise<boolean> {
  const {period, limit} = QUOTAS[kind];
  const max = limit(user.plan);
  if (max === null) return true;
  if (max <= 0) return false;
  const supabase = getSupabaseAdmin();
  if (!supabase || user.id === DEV_USER.id) return true;

  const {data, error} = await supabase.rpc('increment_usage', {
    p_user: user.id,
    p_kind: kind,
    p_period: periodStart(period),
    p_limit: max,
  });
  if (error) {
    // Fail closed: never hand out unmetered AI usage when the counter is unreachable.
    console.error('[quota] increment_usage failed', error);
    return false;
  }
  return data === true;
}
