# Implementation Roadmap

> **Revision 2 (2026-11-05) — Lean plan. Supersedes §2 D1/D2/D3-deploy, §4 task order and §6 below.**
> Owner direction: this phase is about **UX/UI improvement**, not production readiness. Original detail in §1–9 stays as the backlog; tasks marked *Deferred* below are not scheduled.

## R2.1 What changed and why

| Area | Original plan | Lean plan | Reason |
|---|---|---|---|
| E2E / visual / axe suite (T0.2, T0.3) | Playwright in repo, 6-combination matrix, baseline + visual regression | **Deferred.** Screenshots taken ad hoc by the orchestrator with a script **outside the repo** (390 / 1440, light / dark) and shown to the owner | Infrastructure cost before any visible UI change |
| Unit tests (T0.1) | Vitest from day one | **Only when non-trivial new logic appears** (e.g. session timer state machine), scoped to that logic | No logic is rewritten in early deliverables |
| ESLint / Prettier (T0.4) | Deliverable 1 | **Deferred** (optional later) | Not needed to improve UI |
| Contrast script (T1.1) | Automated check | **Dropped.** Ratios already calculated in `ui-specifications.md` §2.1 | Duplicate effort |
| `/__ui` gallery (T2.10) | Dev route with all primitives | **Dropped.** Primitives are reviewed inside real screens | Unused surface |
| Primitives (M2) | All ~30 built before screens | **Just in time**: a small core first, the rest built with the screen that needs it | Avoid building unused components |
| Domain store (T3.2, D2) | Port ~30 handlers into Context + `useReducer` reducers | **Thin `AppStateContext`** that exposes the existing `App.tsx` state and handlers unchanged (move, don't rewrite). Reducers only if a screen needs it | Enables router + shell without rewriting working logic |
| Storage v3 migration (T3.1) | Versioned module + fixtures | **Only surface write errors** (replace silent `catch`). Bump `_vN` only if a screen changes the persisted shape | Minimal risk, minimal work |
| AI client + mock adapter (T3.3–T3.5, D1) | Client-side mock adapter, flag, failure injection | **Deferred.** Keep `/api/*` (server fallbacks already simulate AI). A single constant `AI_SIMULATED = true` drives the "Simulado" badge everywhere | Server fallbacks already work locally |
| Vercel deploy (T4.7, T6.6) | Part of shell deliverable | **Deferred** until a shareable preview is needed (then D1 mock adapter is required, because Express does not run on Vercel as-is) | Not production yet |
| Characterization tests for material renderers (T5.6c) | Required before rewrite | **Dropped.** Renderers are restyled, logic kept | Logic not rewritten |
| Hardening (T6.2 VoiceOver, T6.5 Lighthouse, `rg` guards) | Release gate | **Deferred**; a manual keyboard + responsive pass stays in the final deliverable | Not releasing |

What does **not** change: the approved UX/UI (P0 fixes first, accessibility and responsive as requirements), router with URLs, folder structure by feature (D6), strangler migration (D7), `server.ts` / `vite.config.ts` untouched (D9).

## R2.2 Lean deliverables (one branch/commit each)

| # | Deliverable | Tasks (ids from §4, adapted) | Visible outcome |
|---|---|---|---|
| L1 | **Tokens, font, theme, document basics** | T0.5, T1.1 (no script), T1.2, T1.3, T1.4 | New palette, Plus Jakarta Sans, Claro/Oscuro/Sistema; legacy screens re-pointed to tokens where cheap |
| L2 | **Core primitives** | Button, IconButton, TextField/Textarea, Switch, SegmentedControl, Dialog/Sheet/ConfirmDialog, Menu, Toast/InlineAlert, Card, Chip, StatusBadge, SimulatedBadge, EmptyState | Building blocks (used from L3 on) |
| L3 | **Router + shell** | T4.1–T4.5 with thin `AppStateContext` | URLs per screen, TopBar + account menu, NotebookHeader, tabs / bottom bar; old navbar, bottom bar, banner, FAB removed |
| L4 | **Mis cuadernos (P0 UX-02)** | T5.2a, T5.2b | Keyboard-operable cards, visible menu, dialogs, undo |
| L5 | **Chat (P0 UX-01)** | T5.3a, T5.3b | Honest errors + retry, "Simulado", Markdown, multiline |
| L6 | **Fuentes + Buscar en la web** | T5.4a, T5.4b, T5.5 | One "Añadir fuente", statuses, switches |
| L7 | **Materiales** | T5.6a, T5.6b (renderers restyled) | Quick create, Personalizar, viewer |
| L8 | **Estudiar** | T5.7a–c (+ Vitest for the timer only) | One-step session, Modo blindado |
| L9 | **Bienvenida, Progreso, Ayuda, Cuenta** | T5.1, T5.8, T5.9, T5.10 | Account-level pages |
| L10 | **Cleanup + manual a11y/responsive pass** | T6.1, T6.3 (manual), T6.4 | Legacy code removed |

Order rationale: L1–L3 are prerequisites shared by every screen; L4–L5 fix the two P0 issues; L6–L9 follow user-value order; L10 last.

## R2.3 Verification per deliverable (replaces automated gates for now)

1. `pnpm lint` (tsc) and `pnpm build` pass.
2. Orchestrator screenshots of touched screens at 390 and 1440, light and dark, shown to the owner.
3. Manual keyboard check of touched interactions (Tab, Enter, Escape, focus visible).
4. Acceptance criteria of the included tasks, **excluding** items that require the deferred suites (see `acceptance-criteria.md` R2 note).

## R2.4 Deferred backlog

T0.1 (full), T0.2, T0.3, T0.4, T2.10, T3.1 (versioned migration), T3.2 (full reducers), T3.3–T3.5, T4.6 (offline toast part), T4.7, T5.6c tests, T6.2 (automated + VoiceOver), T6.5, T6.6.

---

Role: Senior Frontend Architect / Technical PM. Status: approved 2026-11-05; **revised to the lean plan above** (R2 approved 2026-11-05).

Inputs (all approved): `project-context.md`, `audit/*`, `design/*`, `decisions.md`. Companions: `acceptance-criteria.md` (AC per task + Definition of Done), `testing-strategy.md`.

Priorities: **P0** blocks release / fixes a P0 issue · **P1** required for the redesign release · **P2** quality, can trail · **P3** polish.
Size: **S** ≤ ½ day · **M** 1–2 days · **L** 3–4 days (split if larger).

## 1. Current frontend at a glance

| Fact | Evidence | Consequence |
|---|---|---|
| 12 screen-level components, 217–1797 lines; no primitives | `components-inventory.md` | Primitives must be built first |
| All state + ~30 domain handlers in `App.tsx` (1146 lines) | `rg "const handle"` | Extract to a store before routing |
| 10 direct `fetch('/api/...')` calls in 7 files | `rg fetch` | Single AI client needed to mock and to label "Simulado" |
| localStorage read/write only in `App.tsx`, silent `catch` | `App.tsx` 46–296 | One storage module with surfaced errors |
| Two theming mechanisms (`isDarkMode` ternaries + ~400 `dark:`) | `project-context.md` §6 | Replace both with CSS variables |
| No router, single URL | `routes-and-pages.md` | Router added (decision A7) |
| No tests, no linter beyond `tsc` | `project-context.md` §8 | Testing infrastructure is task #1 |
| `motion` dependency unused | `rg "from 'motion"` = 0 | Remove or use for dialog/sheet transitions |
| Deploy target Vercel; server is Express | `decisions.md` | Mocks run client-side; Express untouched for now |

## 2. Architecture decisions for implementation

| # | Decision | Why | Alternative (rejected) |
|---|---|---|---|
| D1 | **Client-side AI mock adapter** behind one `aiClient` interface (`mock` default, `server` = current `/api/*`) selected by `VITE_AI_MODE` | Owner: everything mocked for now; Vercel static deploy works with no functions; one place to attach `simulated: true` | Rely on server fallbacks → needs Express on Vercel now |
| D2 | **Domain store** = React Context + `useReducer` per domain (library, notebook content, study stats, profile/prefs), actions ported from `App.tsx` handlers | No new dependency; handlers already exist; keeps logic testable as pure reducers | Zustand (small dep, less boilerplate) — acceptable if owner prefers |
| D3 | **Router**: React Router (declarative/library mode), routes per `information-architecture.md` §4; Vercel rewrite `/* → /index.html` | Mature, small API, works with Vite SPA | TanStack Router (more setup), wouter (fewer features) |
| D4 | **Styling**: Tailwind v4 `@theme` mapped to CSS variables from `ui-specifications.md` §2; `data-theme` on `<html>` | Keeps Tailwind, removes both legacy mechanisms | CSS modules / CSS-in-JS (rewrite cost) |
| D5 | **Primitives in-house** (`src/ui/`), accessibility patterns hand-built and tested; consider Radix-style headless library only for Dialog/Menu if effort exceeds estimate | Small surface (~40 components), tokens are custom | Full component library (heavy, fights tokens) |
| D6 | **Folder structure** (screaming / feature-first): `src/ui/` (primitives), `src/app/` (shell, router, providers), `src/features/<feature>/` (screens + feature components + hooks), `src/domain/` (types, reducers), `src/services/` (storage, ai, audio) | Matches expertise in screaming architecture; isolates features for small PRs | Keep flat `components/` |
| D7 | **Strangler migration** per route: new shell + router first, each route renders the legacy component until its redesigned screen replaces it | App stays usable after every merge | Big-bang rewrite |
| D8 | **Persistence v3**: keep keys, bump `_v2 → _v3` only when shapes change (accent color, artifact `status`, removal of legacy `chatMessages`) with a one-time migration from v2 | Required by project rule; no data loss for seeded users | Silent shape change |
| D9 | `server.ts` and `vite.config.ts` HMR logic **unchanged** | Standing constraint | — |

## 3. Reuse / refactor / new

### 3.1 Reusable as-is (move only)

| Asset | Target |
|---|---|
| `src/types/index.ts` (domain types) | `src/domain/types.ts` (+ small additions: `simulated`, artifact `status`, theme `system`) |
| `src/data/initialData.ts` (seed) | `src/domain/seed.ts` (used by "datos de ejemplo") |
| `src/services/audioSynthesizer.ts` | unchanged (`services/audio`) |
| Domain handlers in `App.tsx` (create/move/delete folder & notebook, sources, artifacts, threads, stats) | Ported as reducer actions — logic reused, not rewritten |
| Server request/response shapes for 9 endpoints | Kept as `server` adapter of `aiClient` |
| `recharts` usage in `WeeklyStudyChart` | Chart logic reused inside Progreso |
| Images `src/assets/images/*` | Folder covers, avatar |

### 3.2 Needs refactor (logic kept, UI rebuilt)

| Component | Lines | Refactor |
|---|---|---|
| `App.tsx` | 1146 | Split into providers (store, theme, toasts), router, shell; Focus-mode listeners → `useBlindadoSession` hook |
| `NotebooksExplorer` | 814 | → `features/library`: screen, NotebookCard, FolderFilter, dialogs |
| `NotebookChat` | 871 | → `features/chat`: ThreadsPanel, Conversation; fetch → `aiClient.chat`; failure path rewritten (UX-01) |
| `NotebookSources` | 1188 | → `features/sources`: list, AddSourceDialog, analysis panel; file extraction via `aiClient.extractFile` |
| `NotebookArtifacts` | 1797 | → `features/materials`: TypeGrid, CreateSheet, Gallery, Viewer + one renderer per type (quiz, flashcards, podcast, infographic, document) |
| `NotebookMethods` | 1363 | → `features/study`: SessionSetup, SessionRunning, Blindado overlay, ActiveRecall, Flashcards |
| `WeeklyStudyChart` | 440 | → `features/progress` |
| `SupportAgentChatbot` | 487 | → `features/help` using shared ChatMessage/Composer |
| `GoogleSearchAgent` | 660 | → `features/web-search` (dialog launched from sources/chat) |
| `StudentProfileModal` | 372 | → `features/account` (Perfil, Preferencias pages) |
| `LoginScreen` | 217 | → `features/welcome` |
| `Navbar` | 289 | **Replaced** by TopBar + NotebookHeader (no logic worth keeping beyond stats display) |
| `index.css` | 64 | Replaced by tokens + base layer; global color overrides removed |

### 3.3 New

- **Primitives** (`src/ui/`): Button, IconButton, Link, Menu, TextField, Textarea, Select, Switch, Checkbox, Radio, SegmentedControl, SearchField, FileDrop, IconPicker, Tabs, BottomTabBar, Breadcrumb, Card, Chip, Avatar, StatusBadge, SimulatedBadge, Dialog, Sheet, ConfirmDialog, Toast, InlineAlert, EmptyState, Spinner, Skeleton, Panel.
- **Composites**: TopBar, TodayChip, NotebookHeader, ChatMessage, Composer, CitationChip/Inspector, RequestCard, Timer, Flashcard, StatTile, Chart wrapper, FullscreenViewer.
- **Services**: `storage` (versioned repository + error events), `aiClient` (interface + mock + server adapters), `useSimulatedLabel`.
- **New screens**: Progreso, Ayuda page, Cuenta pages, Not found.

## 4. Modules and tasks

Legend per task: **Goal · Files · Deps · AC · Tests · P · Size**. AC ids refer to `acceptance-criteria.md`.

### M0 — Foundations & safety net

| ID | Goal | Files / components | Deps | AC | Tests | P | Size |
|---|---|---|---|---|---|---|---|
| T0.1 | Test tooling: Vitest + React Testing Library + jsdom; `npm run test` | `package.json`, `vitest.config.ts`, `src/test/setup.ts` | — | AC-T0.1 | Smoke test renders `<App/>` | P0 | S |
| T0.2 | E2E tooling: Playwright + `@axe-core/playwright`, projects for 390/768/1440 × light/dark | `playwright.config.ts`, `e2e/` | — | AC-T0.2 | 1 smoke e2e (login → explorer) | P0 | S |
| T0.3 | Baseline "before" screenshots of all current screens | `e2e/baseline.spec.ts`, `redesign/screenshots/before/` | T0.2 | AC-T0.3 | The capture itself | P1 | S |
| T0.4 | Lint/format: ESLint (react-hooks, jsx-a11y) + Prettier; `lint` = tsc + eslint | config files | — | AC-T0.4 | CI script passes on current code (warnings allowed for legacy files) | P1 | S |
| T0.5 | Document basics: `lang="es"`, title/meta, remove AI Studio favicon name, package name | `index.html`, `package.json` | — | AC-T0.5 | e2e asserts `lang` | P0 | S |
| T0.6 | Remove unused `motion` dep (or keep if T2 decides to use it) | `package.json` | T2.8 | AC-T0.6 | build passes | P3 | S |

### M1 — Design tokens & theming

| ID | Goal | Files | Deps | AC | Tests | P | Size |
|---|---|---|---|---|---|---|---|
| T1.1 | Tokens as CSS variables (light/dark) + Tailwind `@theme` mapping (colors, radius, shadow, spacing, type scale) | `src/styles/tokens.css`, `src/index.css` | T0.1 | AC-T1.1 | Unit: contrast check script over token pairs | P0 | M |
| T1.2 | Plus Jakarta Sans self-hosted (400–700, latin-ext), `font-display: swap` | `public/fonts/`, `tokens.css` | T1.1 | AC-T1.2 | e2e: computed font-family | P1 | S |
| T1.3 | Theme provider: `light/dark/system`, `data-theme` on `<html>`, migrate `mia_theme_mode` values | `src/app/providers/ThemeProvider.tsx` | T1.1 | AC-T1.3 | Unit: mode resolution, persistence, migration of `"dark"`/`"light"` | P0 | S |
| T1.4 | Base layer: focus ring, reduced motion, body text, remove global color overrides | `src/styles/base.css` | T1.1 | AC-T1.4 | e2e axe on login | P1 | S |

### M2 — UI primitives (`src/ui/`)

Each primitive ships with unit tests (behavior + a11y roles) and an entry in a lightweight `/__ui` dev-only gallery route (no Storybook, to avoid a new toolchain).

| ID | Goal | Deps | AC | P | Size |
|---|---|---|---|---|---|
| T2.1 | Button, IconButton, Link, Spinner | T1.1 | AC-T2.1 | P0 | S |
| T2.2 | TextField, Textarea (auto-grow), Select, SearchField, field error pattern | T1.1 | AC-T2.2 | P0 | M |
| T2.3 | Switch, Checkbox, Radio, SegmentedControl | T1.1 | AC-T2.3 | P0 | M |
| T2.4 | Dialog, Sheet (responsive), ConfirmDialog (focus trap, Escape, return focus, scroll lock) | T2.1 | AC-T2.4 | P0 | L |
| T2.5 | Menu (keyboard, typeahead, sheet on phone), context-menu trigger | T2.4 | AC-T2.5 | P0 | M |
| T2.6 | Toast system (queue of 1, undo action, live region) + InlineAlert | T2.1 | AC-T2.6 | P0 | M |
| T2.7 | Tabs (nav + tablist modes), BottomTabBar, Breadcrumb | T2.1 | AC-T2.7 | P0 | M |
| T2.8 | Card, Chip (4 variants), Avatar, StatusBadge, SimulatedBadge, EmptyState, Skeleton, Panel (collapsible) | T2.1 | AC-T2.8 | P1 | M |
| T2.9 | FileDrop, IconPicker | T2.2, T2.3 | AC-T2.9 | P1 | M |
| T2.10 | `/__ui` gallery (dev only, excluded from prod build) | T2.1–T2.9 | AC-T2.10 | P2 | S |

Files: `src/ui/<Component>/<Component>.tsx` + `.test.tsx`; tests: RTL behavior + `jest-axe`-style checks (via `axe-core` in Vitest).

### M3 — Data & services

| ID | Goal | Files | Deps | AC | Tests | P | Size |
|---|---|---|---|---|---|---|---|
| T3.1 | Storage module: typed get/set per key, version + migration v2→v3, emits `storage-error` events; quota errors surfaced | `src/services/storage/` | T0.1 | AC-T3.1 | Unit: migration fixtures, quota simulation | P0 | M |
| T3.2 | Domain store: reducers + actions ported from `App.tsx` handlers (library, notebook content, threads, stats, profile/prefs); persistence via T3.1 | `src/domain/`, `src/app/providers/StoreProvider.tsx` | T3.1 | AC-T3.2 | Unit: every action (create/move/delete, last-thread rule, stats update) | P0 | L |
| T3.3 | `aiClient` interface for the 9 operations + `server` adapter (current fetch payloads) + error normalization | `src/services/ai/` | T0.1 | AC-T3.3 | Unit with mocked `fetch`: success, 500, network error | P0 | M |
| T3.4 | `mock` adapter: deterministic Spanish responses per operation (reuse server fallback texts), 400–1200 ms latency, failure injection (`?ai_fail=1` in dev), every result `simulated: true` | `src/services/ai/mock/` | T3.3 | AC-T3.4 | Unit: shapes match types; failure injection | P0 | M |
| T3.5 | Feature flag `VITE_AI_MODE` (default `mock`), documented in README/.env.example | `.env.example`, `src/services/ai/index.ts` | T3.4 | AC-T3.5 | Unit: adapter selection | P1 | S |

### M4 — App shell & routing

| ID | Goal | Files | Deps | AC | Tests | P | Size |
|---|---|---|---|---|---|---|---|
| T4.1 | Router with all routes from IA §4; each route initially renders the **legacy** component (strangler); 404 page | `src/app/router.tsx`, `src/main.tsx` | T3.2 | AC-T4.1 | e2e: every URL renders; Back/Forward | P0 | M |
| T4.2 | Session gate: Bienvenida when no session; "Empezar" continues to requested URL; reload → Bienvenida (A3) | `src/app/SessionGate.tsx` | T4.1 | AC-T4.2 | e2e deep link → login → same URL | P0 | S |
| T4.3 | TopBar + TodayChip + Account menu (Perfil, Preferencias, Tema, Cerrar sesión) | `src/app/shell/` | T2.5, T2.7 | AC-T4.3 | e2e: logout from menu; 320 px no overflow | P0 | M |
| T4.4 | NotebookHeader + section Tabs (≥ 640) / BottomTabBar (< 640) | `src/app/shell/NotebookLayout.tsx` | T4.1, T2.7 | AC-T4.4 | e2e: 4 sections reachable at 390 | P0 | M |
| T4.5 | Remove legacy Navbar, bottom stats bar, support FAB, notebook banner once shell is live | `App.tsx`, `Navbar.tsx` | T4.3, T4.4 | AC-T4.5 | Visual diff; no duplicate "Salir" | P1 | S |
| T4.6 | Global storage-error banner + offline toast | `src/app/shell/` | T3.1, T2.6 | AC-T4.6 | Unit + e2e with quota stub | P1 | S |
| T4.7 | Vercel config: SPA rewrite, build command, env `VITE_AI_MODE=mock` | `vercel.json` | T4.1 | AC-T4.7 | Preview deploy: deep link refresh works | P1 | S |

### M5 — Screens (each replaces its legacy route)

| ID | Goal | Files | Deps | AC | Tests | P | Size |
|---|---|---|---|---|---|---|---|
| T5.1 | Bienvenida (returning + first-run with "datos de ejemplo") | `features/welcome/` | T4.2 | AC-T5.1 | e2e both paths | P1 | S |
| T5.2a | Mis cuadernos: grid, NotebookCard (focusable), search, folder filter, empty states | `features/library/` | T4.3, T2.8 | AC-T5.2a | e2e keyboard open (UX-02); axe | **P0** | M |
| T5.2b | Library actions: Nuevo cuaderno/carpeta dialogs (inline validation), Mover a…, delete + undo | `features/library/` | T5.2a, T2.4–T2.6 | AC-T5.2b | e2e move via menu (touch + keyboard) | P0 | M |
| T5.3a | Chat: ThreadsPanel, conversation, Composer (multiline), Markdown subset renderer | `features/chat/` | T4.4, T3.4 | AC-T5.3a | Unit: markdown renderer; e2e ask | P0 | L |
| T5.3b | Chat trust states: error + retry, SimulatedBadge, citations + inspector only on service citations, last-thread rule | `features/chat/` | T5.3a | AC-T5.3b | e2e forced failure (UX-01) | **P0** | M |
| T5.4a | Fuentes: list, SourceRow, switches, status, analysis panel | `features/sources/` | T4.4 | AC-T5.4a | e2e toggle grounding | P1 | M |
| T5.4b | Añadir fuente dialog (Archivo/Enlace/Texto), FileDrop, size warning | `features/sources/` | T5.4a, T2.9 | AC-T5.4b | e2e add text + file fixture | P1 | M |
| T5.5 | Buscar en la web dialog (from Fuentes & Chat), "Añadir como fuente" | `features/web-search/` | T5.4b, T5.3a | AC-T5.5 | e2e search → source added | P1 | M |
| T5.6a | Materiales: TypeGrid, quick-create sheet + Personalizar, background generation (artifact `status`), gallery | `features/materials/` | T4.4, T3.4 | AC-T5.6a | Unit: options defaults/memory; e2e create quiz | P1 | L |
| T5.6b | Viewer: fullscreen route, Lectura/Interactivo, zoom, print, copy, Ajustar material | `features/materials/viewer/` | T5.6a | AC-T5.6b | e2e open/close via Back | P1 | L |
| T5.6c | Type renderers ported: quiz, flashcards, podcast, infographic, document types | `features/materials/renderers/` | T5.6b | AC-T5.6c | Unit per renderer | P1 | L |
| T5.7a | Estudiar → Sesión: setup, one-step start, Timer, pause/finish, micro-question, summary, `beforeunload` | `features/study/session/` | T4.4 | AC-T5.7a | Unit: timer state machine (fake timers) | P1 | L |
| T5.7b | Modo blindado: fullscreen request, visibility warning, sound, counter, visible exit, no key lock, fallback when unsupported | `features/study/blindado/` | T5.7a | AC-T5.7b | e2e keyboard exit; unit visibility handler | **P1** | M |
| T5.7c | Repaso activo + Tarjetas | `features/study/` | T5.7a | AC-T5.7c | e2e flip/master | P1 | M |
| T5.8 | Progreso page: stat tiles, chart + hidden table, goal, manual log + undo | `features/progress/` | T4.3 | AC-T5.8 | Unit: stats aggregation; axe | P1 | M |
| T5.9 | Ayuda page/panel: assistant, chips, RequestCard ("Solicitud enviada"), FAQ | `features/help/` | T5.3a | AC-T5.9 | e2e request flow wording (UX-06) | P1 | M |
| T5.10 | Cuenta: Perfil + Preferencias (theme, reset example data); plan hidden | `features/account/` | T4.3 | AC-T5.10 | e2e reset with confirm | P1 | M |

### M6 — Cleanup, hardening, release

| ID | Goal | Deps | AC | Tests | P | Size |
|---|---|---|---|---|---|---|
| T6.1 | Delete legacy components, `isDarkMode` props, `dark:` leftovers, legacy `chatMessages` field (v3 migration) | all M5 | AC-T6.1 | `rg` guards in CI; unit migration | P1 | M |
| T6.2 | Accessibility pass: full axe suite, keyboard walkthrough, screen-reader smoke (VoiceOver) | all M5 | AC-T6.2 | e2e axe all routes × themes | P0 | M |
| T6.3 | Responsive pass: 320/390/768/1024/1440, 200 % zoom | all M5 | AC-T6.3 | Visual regression "after" set | P0 | M |
| T6.4 | Copy pass: glossary, Spanish errors, no demo strings | all M5 | AC-T6.4 | `rg` guard for banned strings | P2 | S |
| T6.5 | Performance budget: route-level code splitting (Materiales viewer, Progreso chart), font subset | all M5 | AC-T6.5 | Lighthouse ≥ 90 perf/a11y on preview | P2 | S |
| T6.6 | Release on Vercel (mock mode), README update | T4.7, T6.2, T6.3 | AC-T6.6 | Smoke on preview URL | P1 | S |

## 5. Dependency graph

```
M0 ──► M1 ──► M2 ──────────────┐
  └──► M3 (storage, store, ai) ─┴──► M4 (router + shell) ──► M5 screens ──► M6
                                                       │
           T5.2 Library ◄── T4.3 TopBar               │
           T5.3 Chat ──► T5.5 Web search ◄── T5.4 Sources
           T5.3 Chat ──► T5.9 Ayuda (shared ChatMessage/Composer)
           T5.6a ──► T5.6b ──► T5.6c
           T5.7a ──► T5.7b, T5.7c
```

M1/M2 and M3 can run in parallel (different files). Inside M5, screens are independent once M4 is done, except the arrows above.

## 6. Recommended order (deliverables)

Each step is one PR (≤ ~400 changed lines where possible; split tasks marked L).

| # | Deliverable | Tasks | Visible outcome |
|---|---|---|---|
| 1 | Safety net | T0.1, T0.2, T0.3, T0.5 | Tests run; baseline screenshots; `lang="es"` |
| 2 | Tokens & theme | T1.1–T1.4 | Tokens available; legacy UI unchanged (vars unused yet) |
| 3 | Data layer | T3.1–T3.5 | Mock AI with "simulado"; storage errors surfaced; no UI change |
| 4 | Primitives batch A | T2.1–T2.4 | Gallery route |
| 5 | Primitives batch B | T2.5–T2.9 | Gallery complete |
| 6 | Router + shell | T4.1–T4.4, T4.7 | URLs, new TopBar/tabs around legacy screens; Vercel preview |
| 7 | **P0 fixes first** | T5.2a, T5.2b, T5.3a, T5.3b | Library keyboard-accessible; honest chat failures |
| 8 | Remove old chrome | T4.5, T4.6 | Chrome budget met |
| 9 | Sources + web | T5.4a, T5.4b, T5.5 | |
| 10 | Materials | T5.6a–c | |
| 11 | Study | T5.7a–c | One-step session, Modo blindado |
| 12 | Account-level pages | T5.1, T5.8, T5.9, T5.10 | Progreso, Ayuda, Cuenta |
| 13 | Hardening & release | T6.1–T6.6 | Redesign live (mock mode) |

## 7. Migration strategy

1. **Strangler by route.** Router first; each route points to the legacy component wrapped in the new shell. A screen PR swaps the route target. The legacy component is deleted only in T6.1.
2. **State first, UI second.** The domain store (T3.2) is introduced while legacy components still receive props — an adapter passes store state/actions as the old props, so legacy and new screens share one source of truth.
3. **Persistence compatibility.** Read v2 keys, write v3 after migration; keep v2 data untouched until the first successful v3 write (rollback-safe). Theme value migration `light|dark → light|dark` and new `system`.
4. **AI behind the interface.** Legacy components switch from `fetch` to `aiClient` in T3.3 (mechanical), so mocks and "Simulado" work everywhere before screens are redesigned.
5. **Theming coexistence.** Legacy screens keep `dark:` classes keyed on `.dark`; ThemeProvider sets both `data-theme` and the `.dark` class until T6.1 removes the class.
6. **No feature removed** at any step (feature retention matrix, `ux-proposal.md` §6) — checked in each screen PR's AC.

## 8. Technical risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `NotebookArtifacts` (1797 lines) hides behaviors not in the docs | High | High | Port renderers one by one with characterization tests before rewriting (T5.6c) |
| localStorage quota with base64 files | Medium | High | T3.1 surfaces errors; size warning; consider IndexedDB later (out of scope) |
| Fullscreen / visibility APIs differ (iOS Safari, headless) | High | Medium | Feature-detect; documented fallback; e2e stub of APIs; manual device test |
| Focus trap / menu a11y bugs in hand-built primitives | Medium | High | Tests per primitive; fallback to a headless lib (D5) if > estimate |
| Strangler adapter complexity in `App.tsx` | Medium | Medium | Keep adapter thin; time-box; screens migrated in dependency order |
| Typescript 7 / React 19 / Vite 8 compatibility of new libs (router, testing) | Medium | Medium | Verify versions at install (context7/docs); pin |
| Mock responses diverge from real Gemini shapes | Medium | Medium | Mock adapter typed by the same interfaces; contract test of `server` adapter against `server.ts` fallbacks |
| Vercel deploy of Express later (real AI) | Certain (later) | Medium | Out of this roadmap; `aiClient` server adapter isolates the change |
| Persistence migration bug loses user data | Low | High | Unit fixtures from current seed; keep v2 copy until v3 verified |
| Scope creep (auth, DB) | Medium | Medium | Explicitly out of scope; separate roadmap |

## 9. Out of scope

Real AI integration, real authentication, database/sync, real reservations, analytics, Express → Vercel functions migration, IndexedDB storage. Each depends on owner decisions recorded in `decisions.md`.
