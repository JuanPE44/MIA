# Testing Strategy

> **Revision 2 (lean plan, see `roadmap.md` R2).** Current phase uses only: `tsc` + `vite build`; ad-hoc screenshots (390 / 1440 × light / dark) captured by the orchestrator with Playwright installed **outside the repo**; manual keyboard checks; Vitest added only for new non-trivial logic (session timer first). Everything else below is the target strategy for when the product moves toward production.

Status: **proposal, awaiting owner approval**. Today the project has **no tests**; only `tsc --noEmit` (`project-context.md` §8). This strategy is introduced by roadmap task T0.1–T0.4 and grows with each deliverable.

## 1. Goals

1. A safety net **before** refactoring (characterization + baseline screenshots).
2. Prove the fixed issues stay fixed (UX-01, 02, 03, 05, 07, 10, 23… as regression tests).
3. Enforce WCAG 2.2 AA and the responsive matrix automatically where possible.
4. Fast feedback: unit < 30 s, e2e smoke < 2 min locally.

## 2. Tooling

| Layer | Tool | Notes |
|---|---|---|
| Unit / component | **Vitest** + **React Testing Library** + `@testing-library/user-event`, jsdom | Same Vite pipeline; TS 7 compatibility verified at install |
| Accessibility (component) | `axe-core` run inside Vitest | Per primitive |
| E2E | **Playwright** (Chromium; WebKit for iOS-like checks on key flows) | Browsers already cached locally |
| Accessibility (page) | `@axe-core/playwright` | Every route × theme |
| Visual regression | Playwright `toHaveScreenshot` | Masks dynamic regions (timer, dates) |
| Static | `tsc --noEmit`, ESLint (`react-hooks`, `jsx-a11y`), Prettier, `rg` guards | `npm run lint` |
| Performance | Lighthouse CI on Vercel preview (manual trigger) | Release gate only |

Library versions are confirmed against current docs at install time (React 19 / Vite 8 / TS 7).

## 3. Test pyramid and ownership

| Layer | Share | What |
|---|---|---|
| Unit (pure) | ~45 % | Reducers/actions, storage migrations, `aiClient` adapters, timer state machine, markdown renderer, stats aggregation, option defaults |
| Component | ~35 % | Each primitive (behavior + a11y), feature components (NotebookCard, SourceRow, ChatMessage, Composer, Timer, Flashcard) |
| E2E | ~20 % | Journeys J1–J15, P0/P1 regressions, responsive and a11y sweeps |

## 4. What to test, by area

### 4.1 Services and domain (unit)

| Subject | Cases |
|---|---|
| Storage (T3.1) | read/write per key; v2 → v3 migration with seed fixture and edge cases (missing fields, legacy `chatMessages`, theme `dark`/`light`); quota error → event; v2 kept until v3 verified |
| Store actions (T3.2) | every ported handler: create/rename/move/delete folder & notebook; add/delete/toggle source; select all; add/update/delete artifact; thread new/rename/delete (last-thread rule); stats update (minutes, XP, streak, sessions); reset demo |
| `aiClient` (T3.3) | server adapter: payload equality with current calls; 200, 500, network error, invalid JSON → normalized error |
| Mock adapter (T3.4) | typed shapes for 9 operations; `simulated: true`; deterministic output by seed; failure injection |
| Timer machine (T5.7a) | start/pause/resume/finish; stage transitions study→short break→…→long break; minutes credited once; fake timers |
| Markdown subset (T5.3a) | bold/italic/lists/headings/code/links rendered; HTML escaped (no XSS); unknown syntax shown as text |

### 4.2 Components

- **Primitives:** keyboard (Tab, Enter, Space, arrows, Escape), roles/names, focus return, disabled-with-reason, hit area classes, both themes snapshot-free (assert roles, not markup).
- **Characterization before rewrite** (T5.6c especially): render the legacy quiz/flashcards/podcast/infographic with seed data and assert visible behavior (answers, score, flip, hint); the new renderer must pass the same tests.
- **Trust UI:** ChatMessage never renders citations or verification text when `error` or when the response has no service citations; SimulatedBadge present when `simulated`.

### 4.3 E2E journeys (Playwright, mock AI)

| Spec | Journey / issue | Key assertions |
|---|---|---|
| `welcome.spec` | J1 | first-run choices; returning "Empezar"; deep link → login → same URL |
| `library.spec` | J2, J3, UX-02, UX-19, UX-24 | Tab to a foldered notebook + Enter opens it; Mover a… via keyboard and via tap (390); delete + undo |
| `chat.spec` | J5, UX-01, UX-10, UX-16, UX-27, UX-30 | ask → answer with SimulatedBadge; forced failure → error + retry, no citations; Shift+Enter; delete last thread |
| `sources.spec` | J4, J10 | add text/file fixture/link; status transitions; grounding switch; web search → add as source |
| `materials.spec` | J6, J7, UX-26 | create quiz in 3 clicks; Personalizar options remembered; close sheet while generating; viewer URL + Back |
| `study.spec` | J8, J9, UX-07, UX-23 | one-step start; blindado indicator; simulated `visibilitychange` → warning + counter; keyboard exit; flashcards XP |
| `progress.spec` | J14, UX-12 | stats single place; goal change persists; chart table present |
| `help.spec` | J11, UX-06 | request card wording; no "registrada en el sistema" |
| `account.spec` | J12, J13 | theme system/dark/light; reset with confirm; logout once |
| `navigation.spec` | UX-08, A7 | Back/Forward between sections; 404; reload → Bienvenida → continue |
| `a11y.spec` | UI §8 | axe on every route × light/dark; one `h1` per page; `lang="es"` |
| `responsive.spec` | UX-03, UX-21 | no horizontal scroll at 320/390/768/1024/1440; BottomTabBar items visible; composer not covered |

Browser APIs stubbed in e2e: Fullscreen (`requestFullscreen` resolve/reject), `visibilitychange`, Web Audio (silent), clipboard, `beforeunload` (dialog handler).

### 4.4 Visual regression

- Baseline **before** set (T0.3) for comparison only (not asserted).
- **After** set built screen by screen when each M5 task merges; asserted thereafter with 0.2 % pixel threshold.
- Matrix per screen: `390 | 768 | 1440` × `light | dark`; key dialogs/sheets included.
- Dynamic content masked (timer digits, dates, latency-dependent spinners); `reducedMotion: 'reduce'` in all visual runs.

### 4.5 Accessibility (beyond automation)

| Check | When | How |
|---|---|---|
| Keyboard walkthrough J1–J14 | T6.2 | Manual script, results recorded in `redesign/implementation/a11y-log.md` |
| VoiceOver (macOS + iOS) smoke | T6.2 | Login, open notebook, ask, start session, add source |
| 200 % zoom / text spacing | T6.3 | Manual on 1280 |
| Contrast tokens | T1.1 | Script over token pairs |
| Target size | Component tests | Assert min size classes on touch variants |

### 4.6 Manual device checks (release gate)

iPhone Safari (fullscreen unsupported path, keyboard + composer), Android Chrome, iPad, macOS Safari/Chrome/Firefox, Windows Chrome/Edge — on the Vercel preview.

## 5. Test data and determinism

- Seed from `initialData.ts` (moved to `domain/seed.ts`) via a `?seed=demo` dev helper or Playwright `addInitScript` writing localStorage v3.
- Mock AI is deterministic per input; latency fixed to 0 in tests (`VITE_AI_LATENCY=0`).
- Failure injection: mock adapter flag (`?ai_fail=chat` in dev/test) instead of network interception, plus one Playwright `page.route` test against the `server` adapter.
- Fixed clock (`page.clock`) for dates, streaks and timers.

## 6. Selectors

Role- and label-based (`getByRole('button', { name: 'Empezar sesión' })`) as the default — they double as accessibility assertions. `data-testid` only for non-semantic regions (chart canvas, timer ring). Spanish labels come from the glossary; renaming a label requires updating tests in the same PR.

## 7. Running and gates

| Command | Runs | Gate |
|---|---|---|
| `npm run lint` | tsc + eslint + `rg` guards | Every PR |
| `npm run test` | Vitest unit + component | Every PR |
| `npm run e2e:smoke` | welcome, library, chat, navigation on desktop-light + phone-dark | Every PR |
| `npm run e2e` | Full matrix incl. a11y + visual | Before merging a screen PR; nightly if CI exists |
| Lighthouse | Preview URL | Release (T6.5) |

No CI is configured today; a GitHub Actions workflow (lint, test, e2e smoke) is recommended when the repo gets a remote — out of this roadmap unless the owner asks.

## 8. Coverage targets

Not a percentage goal for the whole app (legacy code would distort it). Targets:
- `src/domain/`, `src/services/`: ≥ 90 % lines.
- `src/ui/`: every component has behavior + a11y tests.
- Every P0/P1 UX issue has at least one regression test (table §4.3).

## 9. Risks for testing

| Risk | Mitigation |
|---|---|
| Fullscreen/visibility behave differently headless | Stub APIs; manual device pass |
| Visual tests flaky on fonts/animations | Self-hosted font, reduced motion, masks, fixed viewport/DPR |
| Characterization of 1,800-line legacy component is slow | Limit to user-visible behavior of each renderer |
| TS 7 + tooling incompatibility | Verify on install; pin versions; fallback to `tsc` 5.x for tests only if needed |
