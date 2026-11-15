# Redesign — Decisions and Handoff

Purpose: keep project state across sessions. Update this file whenever the owner decides something. **Nothing below is marked approved unless it says so.**

## Status

| Phase | Output | State |
|-------|--------|-------|
| Technical context | `redesign/project-context.md` | Done |
| Product discovery | `redesign/audit/{product-map,routes-and-pages,user-journeys,components-inventory}.md` | Done. **Approved** (2026-11-05) |
| UX audit | `redesign/audit/{ux-audit,ux-issues}.md` | Done (30 issues: 2 P0, 8 P1, 14 P2, 6 P3). **Approved** (2026-11-05) |
| Figma references | `redesign/reference/` | `Website.svg` + `Website.png` (copied from Downloads; 1 marketing landing, 1440 only) |
| Visual system analysis | `redesign/design/{reference-analysis,design-tokens,component-patterns}.md` | Done. Approval from owner: **Approved** (owner, 2026-11-05) |
| UX proposal | `redesign/design/{ux-proposal,information-architecture,improved-user-journeys}.md` | Done; assumptions A1–A6 confirmed/adjusted by owner (IA §1). **Approved** (2026-11-05) |
| UI / visual proposal | `redesign/design/{ui-specifications,component-specifications,screen-by-screen}.md` | Done. **Approved** (2026-11-05), incl. new status/"Simulado" colors, notebook pastel accents, background material generation |
| Implementation roadmap | `redesign/implementation/{roadmap,acceptance-criteria,testing-strategy}.md` | Done (7 modules, ~45 tasks, 13 deliverables). **Approved** (2026-11-05). **Revision 2 (lean plan, roadmap R2) approved 2026-11-05**: deferred Playwright/ESLint/mock adapter/Vercel; thin AppStateContext instead of full reducers |
| Redesign / implementation | — | **Not started. Do not start without explicit instruction** |

## Open decisions

None at the moment.

## Answered decisions (2026-11-05)

1. Mobile is a primary platform → UX-03 is P0.
2. Real product, but **everything mocked for now**: AI simulated until the API key is solved; no database yet; auth may be made real earlier. Simulated AI output must be labelled.
3. Keep it simple: data persists in localStorage; on reload, position/session/drafts/timer are **not** restored.
4. Accessibility target: **WCAG 2.2 AA**.
5. Reservations are not real → shown as "solicitud".
6. Chat failure: explicit error + retry; offline/simulated answers only when labelled.
8. Light + dark themes.
- Proposed labels accepted as written (Materiales, Repaso activo, Modo blindado, etc.).
- "Modo blindado" is on by default when starting a session.
- Plan labels ("Plan Pro / Universitario") hidden for now.
- Hosting: **Vercel**. Note: `server.ts` (Express) must be adapted to Vercel Functions at deploy time.
7. Router: **yes**, one URL per screen (IA §4). Reload → Bienvenida → "Empezar" continues to the open URL.

## Standing constraints (from the owner's instructions so far)

- Analysis phases: do not modify app code, do not create skills, do not propose visual solutions before approval.
- Keep `vite.config.ts` HMR logic and `server.ts` API contracts intact (project-context.md §12).
- Generated artifacts in English; chat replies in the user's language.

## Top 10 UX issues (for quick orientation; details in `ux-issues.md`)

UX-01 failed chat shown as verified answer (P0) · UX-02 foldered notebooks not keyboard-openable (P0) · UX-03 mobile/tablet overflow, nav clipped · UX-04 tiny/low-contrast text · UX-05 overlays: no dialog semantics, Escape fails · UX-06 reservation "registered" with no storage · UX-07 Focus mode hard to find/mislabelled · UX-08 reload → Login, single URL · UX-09 silent persistence failures (hypothesis) · UX-10 three "Salir", duplicate "+ Iniciar chat".

## Environment notes

- Run: `npm run dev` → http://localhost:3000. No `GEMINI_API_KEY` is set locally, so AI features use the server's offline fallbacks. Real Gemini output has never been observed.
- Evidence screenshots and raw measurements: `redesign/audit/observed/` (including `_ux-measurements.json`).
- Playwright scripts used for the audit live in a temporary scratchpad (not in the repo) and are gone after the session. Chromium is cached at `~/Library/Caches/ms-playwright`; reinstall `playwright-core` in a directory outside the repo to automate again.
- Untracked files not created by this project work: `.atl/`, `pnpm-lock.yaml`.
- A `tsx server.ts` process (PID 53290 at the time of writing) was left running on port 3000 from the audit; stop it before starting a new dev server.

## Corrections already applied to earlier documents

- Delete actions use native `confirm()` (6 sites), not "no confirmation".
- "Iniciar Concentración" only starts the timer; Focus mode is a separate button.

## Decisions from the owner (2026-11-05)

- Visual system in `redesign/design/` approved.
- No more Figma screens exist; tables/dialogs/states/mobile are designed by extension.
- Light + dark themes both required.
- Typeface delegated → **Plus Jakarta Sans** (see `design/design-tokens.md` §10).

## D-2026-11-15 — Visual direction "Tinta y resaltador" (supersedes §10.1 Plus Jakarta Sans)

- Typefaces: **Fraunces** (display), **Hanken Grotesk** (UI/body), **JetBrains Mono** (data). Plus Jakarta Sans removed.
- Palette: warm paper + blue ink + one highlighter accent (background behind dark text only); dark theme "escritorio de noche". Danger/success darkened slightly from the brief (`#BC3B26`, `#2B7549`) to pass AA on the paper background.
- Icons: **Phosphor** behind `src/ui/Icon` (semantic registry). lucide-react removed. Emoji no longer used as icons; notebook/folder icons store registry keys, legacy emoji resolved at read time (no persisted-shape change).
- Shell: persistent left rail on lg+, slim top bar below, bottom tabs on phone (unchanged).
- Motion library `motion` adopted for tab indicator, toast, highlighter sweep and staggered reveals, always gated by reduced motion.
- Full values: `design/design-tokens.md` §11 and `design/ui-specifications.md` §12.
