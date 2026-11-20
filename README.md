<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d559fb82-63c8-4247-a58e-14a0b31cb7b5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Auth local

Auth (email + Google) and plans (free / extended / pro) use Supabase. Requires Docker.

1. `npm run db:start` (first run pulls images; applies `supabase/migrations` and `supabase/seed.sql`). `npm run db:reset` re-applies them, `npm run db:stop` stops everything.
2. Copy the keys printed by `db:start` into `.env.local` (see `.env.example`): `VITE_SUPABASE_URL` / `SUPABASE_URL` (`http://127.0.0.1:54321`), `VITE_SUPABASE_ANON_KEY` (anon key) and `SUPABASE_SERVICE_ROLE_KEY` (service role key). Without them the server runs with no auth (anonymous "pro" dev user) and the login screen shows a notice.
3. `npm run dev`. Confirmation and recovery emails arrive in Mailpit: http://localhost:54324.
4. Seed users (password `MiaTest123!`, email already confirmed): `free@mia.test`, `extended@mia.test`, `pro@mia.test`. They load the demo notebooks on first login; other accounts start empty.
5. Google OAuth: create an OAuth client in Google Cloud with redirect URI `http://127.0.0.1:54321/auth/v1/callback`, then put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `supabase/.env` before `db:start`.

Plans live in `src/config/plans.ts`. Billing is simulated: the plan is stored client-side per user and switched locally from the `/planes` checkout (no network call).

### Deploy on Vercel

- Build: `vite build` into `dist/`; the API is `api/index.ts` (Express app from `server/app.ts`), configured in `vercel.json`.
- Env vars (Production and Preview): `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase Auth > URL Configuration: Site URL = production domain; Redirect URLs = `https://<prod-domain>/auth/callback` and `https://*.vercel.app/**`. The Google redirect URI stays the Supabase one (`https://<project>.supabase.co/auth/v1/callback`).
- Cloud database: `supabase link` + `supabase db push`.
- Vercel rejects request bodies over 4.5 MB, so uploads are limited to 3 MB per file.
- Keepalive: set GitHub secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` for `.github/workflows/supabase-keepalive.yml` (daily ping so the free project does not pause).
