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

async function toApiError(res: Response): Promise<ApiError | null> {
  if (res.status !== 401 && res.status !== 403 && res.status !== 429) return null;
  let body: {code?: string; error?: string} = {};
  try {
    body = await res.clone().json();
  } catch {
    // Non-JSON body: fall back to the generic messages below.
  }
  if (res.status === 401) {
    return new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.', 401, 'UNAUTHENTICATED');
  }
  if (res.status === 403) {
    const locked = body.code === 'PLAN_FEATURE_LOCKED';
    return new ApiError(
      locked ? 'Esta función no está incluida en tu plan. Mejora tu plan para usarla.' : 'No tienes permiso para hacer esto.',
      403,
      locked ? 'PLAN_FEATURE_LOCKED' : 'FORBIDDEN',
    );
  }
  return new ApiError(
    body.error || 'Llegaste al límite de uso de tu plan. Mejora tu plan o inténtalo más tarde.',
    429,
    'PLAN_QUOTA_EXCEEDED',
  );
}

/**
 * `fetch` for `/api/*`: adds the Supabase bearer token and turns 401/403/429
 * into an `ApiError` (also reported once to the UI listener). Any other
 * response is returned untouched so callers keep their own `res.ok` handling.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (currentPlan) headers.set('X-Mia-Plan', currentPlan);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(input, {...init, headers});
  const apiError = await toApiError(res);
  if (apiError) {
    listener?.(apiError);
    throw apiError;
  }
  return res;
}
