# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

AI study copilot ("FocusEd Copilot" / MIA) generated with Google AI Studio. Students organize folders → notebooks, add sources (text/PDF/image/audio/links), then use RAG chat, AI-generated study artifacts, active-recall methods, and a "Focus Shield" Pomodoro mode. UI copy and AI prompts are in Spanish.

## Commands

- `npm run dev` / `npm start` — runs `tsx server.ts` (Express + Vite middleware) on http://localhost:3000
- `npm run build` — `vite build` into `dist/` (production: `NODE_ENV=production tsx server.ts` serves `dist/`)
- `npm run lint` — type-check only (`tsc --noEmit`); no ESLint, no test suite
- Lockfile is `bun.lock`; README says `npm install`

Env: `GEMINI_API_KEY` in `.env.local`/`.env` (see `.env.example`). `DISABLE_HMR=true` disables HMR/file watching (AI Studio sets this — don't change that logic in `vite.config.ts`).

## Architecture

**Single Express server (`server.ts`)** hosts both the API and the SPA. In dev it mounts Vite in middleware mode; in prod it serves `dist/` with an SPA catch-all. All Gemini calls happen server-side via a shared `GoogleGenAI` client (`@google/genai`, model `gemini-3.8-flash`). The key never reaches the browser.

API endpoints (all `POST /api/*`, JSON bodies up to 20mb, files sent as base64):
`extract-file-content`, `process-and-analyze-source`, `analyze-sources`, `generate-artifact`, `refine-artifact`, `chat`, `active-recall`, `support-chat`, `search-grounding`.

**Offline fallbacks are a deliberate pattern**: `ai` is `null` when no API key is set, and most endpoints return heuristic/canned Spanish responses instead of failing (also on Gemini JSON-parse errors). Preserve this when editing endpoints.

**Frontend (`src/`)** — React 19 + Tailwind v4 (via `@tailwindcss/vite`) + `motion` + `lucide-react` + `recharts`. react-router, no state library:
- `src/app/AppStateContext.tsx` is the state hub (`useAppState`): user/session, folders, notebooks, stats, theme, focus mode. Routes in `src/app/routes.tsx`, shell in `src/app/shell/`.
- Screens live in `src/features/*` (`library`, `chat`, `sources`, `materials`, `study`, `progress`, `web-search`, `welcome`, `account`, `help`); shared UI in `src/ui`. Features call their `/api/*` endpoints directly with `fetch`.
- Domain types live in `src/types/index.ts`; seed data (`INITIAL_FOLDERS`, `INITIAL_NOTEBOOKS`, `INITIAL_USER_STATS`, `INITIAL_STUDENT_PROFILE`) in `src/data/initialData.ts`.
- `src/services/audioSynthesizer.ts` — Web Audio ambient sounds/warning beeps for focus mode.

**Persistence is client-only (localStorage), no backend DB.** Login picks a `UserType`: `'frecuente'` loads seed/persisted data, `'nuevo'` starts empty (stored in `sessionStorage` key `focused_auth_usertype`). Persisted keys: `focused_folders_frecuente_v2`, `focused_notebooks_frecuente_v2`, `focused_user_stats_frecuente`, `mia_student_profile`, `mia_theme_mode`. Bump the `_vN` suffix if you change the shape of persisted notebooks/folders.

Path alias `@/*` → repo root.
