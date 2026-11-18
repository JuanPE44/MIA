# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

AI study copilot ("FocusEd Copilot" / MIA) generated with Google AI Studio. Students organize folders → notebooks, add sources (text/PDF/image/audio/links), then use RAG chat, AI-generated study artifacts, active-recall methods, and a "Focus Shield" Pomodoro mode. UI copy and AI prompts are in Spanish.

## Commands

- `npm run dev` / `npm start` — runs `tsx server.ts` (Express + Vite middleware) on http://localhost:3000
- `npm run build` — `vite build` into `dist/` (production: `NODE_ENV=production tsx server.ts` serves `dist/`)
- `npm run lint` — type-check only (`tsc --noEmit`); no ESLint, no test suite
- Lockfile is `bun.lock`; README says `npm install`

Env: `GEMINI_API_KEY` in `.env.local`/`.env` (see `.env.example`); Supabase vars are listed there too (README "Auth local"; `npm run db:start|db:reset|db:stop` use the `supabase` devDependency and need Docker). `DISABLE_HMR=true` disables HMR/file watching (AI Studio sets this — don't change that logic in `vite.config.ts`).

## Architecture

**Express app in `server/app.ts`** (exports `app`, no listen) holds every API route. `server.ts` is the local/prod-self-hosted entry: it imports the app, mounts Vite in middleware mode (dev) or serves `dist/` (prod) and listens on :3000. On Vercel `api/index.ts` re-exports the app as a function and `vercel.json` serves `dist/` + rewrites `/api/*`. All Gemini calls happen server-side via a shared `GoogleGenAI` client (`@google/genai`, model `gemini-3.8-flash`). The key never reaches the browser.

API endpoints (all `POST /api/*`, JSON bodies up to 20mb, files sent as base64; Vercel caps bodies at 4.5 MB so the client limits files to 3 MB):
`extract-file-content`, `process-and-analyze-source`, `analyze-sources`, `generate-artifact`, `refine-artifact`, `chat`, `active-recall`, `support-chat`, `search-grounding`, `plan`.

**Auth and plans**: Supabase Auth (email + Google). Every `/api` route goes through `requireAuth` (`server/auth.ts`: bearer token → `supabase.auth.getUser`, plan from `profiles`). Without `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` it logs a warning and treats requests as an anonymous `pro` dev user. Plan matrix, prices and quotas live in `src/config/plans.ts` (pure TS, shared by server and client). Server enforces features (`requireFeature` → 403 `PLAN_FEATURE_LOCKED`) and quotas (`increment_usage` SQL fn → 429 `PLAN_QUOTA_EXCEEDED`); count limits (notebooks/sources) are enforced client-side. `profiles.plan` changes only via `POST /api/plan` (service role, simulated checkout). Client calls go through `apiFetch` (`src/services/api.ts`). DB schema/seed in `supabase/`.

**Offline fallbacks are a deliberate pattern**: `ai` is `null` when no API key is set, and most endpoints return heuristic/canned Spanish responses instead of failing (also on Gemini JSON-parse errors). Preserve this when editing endpoints.

**Frontend (`src/`)** — React 19 + Tailwind v4 (via `@tailwindcss/vite`) + `motion` + `lucide-react` + `recharts`. react-router, no state library:
- `src/app/AppStateContext.tsx` is the state hub (`useAppState`): user/session, folders, notebooks, stats, theme, focus mode. Routes in `src/app/routes.tsx`, shell in `src/app/shell/`.
- Screens live in `src/features/*` (`library`, `chat`, `sources`, `materials`, `study`, `progress`, `web-search`, `auth`, `plans`, `account`, `help`); shared UI in `src/ui`. Features call their `/api/*` endpoints directly with `fetch`.
- Domain types live in `src/types/index.ts`; seed data (`INITIAL_FOLDERS`, `INITIAL_NOTEBOOKS`, `INITIAL_USER_STATS`, `INITIAL_STUDENT_PROFILE`) in `src/data/initialData.ts`.
- `src/services/audioSynthesizer.ts` — Web Audio ambient sounds/warning beeps for focus mode.

**Persistence is client-only (localStorage), no app-data backend** (Supabase stores only auth, `profiles` and `usage_counters`). There is no anonymous mode: the session comes from Supabase `onAuthStateChange` (`AppStateContext`). Data keys are scoped by user id with a `_v3` suffix: `focused_folders_<uid>_v3`, `focused_notebooks_<uid>_v3`, `focused_user_stats_<uid>_v3`, `mia_student_profile_<uid>_v3`; `mia_theme_mode` stays global. Demo data (`INITIAL_*`) is preloaded on first login only for seed users (email ending `@mia.test`); other accounts start empty. Bump the `_vN` suffix if you change the shape of persisted notebooks/folders.

Path alias `@/*` → repo root.
