# Deploy (Vercel + Supabase)

MIA deploys as a Vite SPA plus one Express function (`api/index.ts`) on Vercel, with Supabase handling auth, `profiles` and `usage_counters`. App data stays in the browser (localStorage). AI runs in simulated mode by default (`AI_SIMULATED=true`), so it costs nothing.

Follow the steps in order, because the Vercel build needs the Supabase keys.

## 1. Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Link it and push the schema from the repo root:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push        # applies supabase/migrations/*
   ```
3. **Authentication → Providers → Email**: turn **Confirm email** off. The MVP signs users in straight after signup.
4. **Authentication → URL Configuration**:
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `https://<your-domain>/auth/callback`. Also add `https://*-<team>.vercel.app/auth/callback` if you want previews to work.
5. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key.

## 2. Google OAuth (optional, for "Continuar con Google")

1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID**, type *Web application*.
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Providers → **Google**: enable it and paste the client ID and secret.
4. The Google consent screen needs an app name, a support email and, to publish, privacy and terms URLs.

## 3. Vercel project

1. Import the GitHub repo at <https://vercel.com/new>. The framework preset is detected from `vercel.json` (build `vite build`, output `dist`).
2. Set these environment variables (Production and Preview) **before the first build**:

   | Variable | Value | Notes |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | Project URL | Build time: redeploy after changing it |
   | `VITE_SUPABASE_ANON_KEY` | anon key | Build time, public |
   | `SUPABASE_URL` | Project URL | Server |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key | Server, **secret** |
   | `AI_SIMULATED` | `true` | Keeps AI simulated |

   Do **not** set `GEMINI_API_KEY` unless you also set `AI_SIMULATED=false` and accept the cost.
3. Deploy, then add your domain and update the Supabase URLs from step 1.4.

## 4. GitHub secrets (keepalive)

`.github/workflows/supabase-keepalive.yml` pings Supabase daily so the free project doesn't pause. In the repo, under **Settings → Secrets and variables → Actions**, add:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 5. Smoke test after deploy

1. Sign up with email. You should land in the app straight away, with no confirmation email, and see the welcome dialog.
2. Finish onboarding. The sample notebook opens.
3. In the sample notebook, check chat, materials (quiz, flashcards), active recall and web search. Each should answer.
4. Refresh on a deep link such as `/progreso` or a notebook URL. It must not 404.
5. Log out, then sign in with Google.
6. If `/api/*` returns 503 `AUTH_NOT_CONFIGURED`, the server env vars are missing.

## Known MVP limits

- Data lives in the browser's localStorage, per device. Clearing site data erases it.
- The Vercel request body cap is 4.5 MB, so the client limits uploads to 3 MB.
- Checkout is simulated: any user can switch plans from the Plans screen.
