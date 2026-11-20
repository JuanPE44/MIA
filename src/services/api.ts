import {ARTIFACT_FEATURE, isPlanTier, planHasFeature, type FeatureKey} from '../config/plans';
import {simulateRequest} from '../../server/simulated/handlers';
import {supabase} from './supabaseClient';

export type ApiErrorCode = 'UNAUTHENTICATED' | 'PLAN_FEATURE_LOCKED' | 'PLAN_QUOTA_EXCEEDED' | 'FORBIDDEN';

/** Thrown by `apiFetch` for 401 / 403 / 429 responses; `message` is already user-readable Spanish. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: ApiErrorCode,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiErrorListener = (error: ApiError) => void;
let listener: ApiErrorListener | null = null;

/** Registers the single UI handler (a toast) notified of every mapped API error. */
export function setApiErrorListener(next: ApiErrorListener | null): void {
  listener = next;
}

let currentPlan: string | null = null;

/** Simulated billing: the client-held plan sent as `X-Mia-Plan` on every call. */
export function setApiPlan(plan: string | null): void {
  currentPlan = plan;
}

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const {data} = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const JSON_HEADERS = {'Content-Type': 'application/json'};

/** Feature a simulated call needs, so a locked plan still gets the upgrade prompt instead of free content. */
function requiredFeature(path: string, body: Record<string, any>): FeatureKey | undefined {
  if (path === '/api/search-grounding') return 'googleSearch';
  if (path === '/api/generate-artifact') return ARTIFACT_FEATURE[String(body?.artifactType)];
  return undefined;
}

function lockedError(): ApiError {
  return new ApiError(
    'Esta función no está incluida en tu plan. Mejora tu plan para usarla.',
    403,
    'PLAN_FEATURE_LOCKED',
  );
}

/**
 * Demo resilience: answers the call locally with the same simulated engine the server uses
 * as its offline branch. Returns `null` when the path has no simulation.
 */
async function simulatedResponse(input: string, init: RequestInit): Promise<Response | null> {
  let body: Record<string, any> = {};
  try {
    body = typeof init.body === 'string' ? JSON.parse(init.body) : {};
  } catch {
    body = {};
  }
  const feature = requiredFeature(input.split('?')[0], body);
  if (feature && isPlanTier(currentPlan) && !planHasFeature(currentPlan, feature)) {
    const error = lockedError();
    listener?.(error);
    throw error;
  }
  const result = await simulateRequest(input, body);
  if (!result) return null;
  return new Response(JSON.stringify(result.body), {status: result.status, headers: JSON_HEADERS});
}

/** True when a backend answer should be replaced by the local simulation. */
function isBackendFailure(res: Response): boolean {
  if (res.status === 401 || res.status === 404 || res.status === 429 || res.status >= 500) return true;
  if (res.status === 403) return false; // handled separately (plan locks keep their upgrade prompt)
  // A 200 that is not JSON (e.g. an SPA rewrite served index.html) means the API is not really there.
  return res.ok && !(res.headers.get('content-type') ?? '').includes('json');
}

/**
 * `fetch` for `/api/*`: adds the Supabase bearer token and the plan. Plan locks (403) become an
 * `ApiError` (also reported once to the UI listener) so the upgrade prompt shows. Any other failure
 * of the backend (network error, 401, 404, 429, 5xx, non-JSON) is answered with the local
 * simulation instead, so the demo never surfaces an error. Other responses (validation 4xx, 2xx)
 * are returned untouched so callers keep their own `res.ok` handling.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (currentPlan) headers.set('X-Mia-Plan', currentPlan);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(input, {...init, headers});
  } catch {
    return (await simulatedResponse(input, init)) ?? Promise.reject(new TypeError('Network error'));
  }

  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    // Only a real plan lock keeps its upgrade prompt, and only while the client plan agrees with it.
    if (body?.code === 'PLAN_FEATURE_LOCKED' && currentPlan !== 'pro') {
      const apiError = lockedError();
      listener?.(apiError);
      throw apiError;
    }
  }
  if (isBackendFailure(res) || res.status === 403) {
    const simulated = await simulatedResponse(input, init);
    if (simulated) return simulated;
  }
  return res;
}
