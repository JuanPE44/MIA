# UX Audit

Role: Senior UX Designer / UX Researcher. Scope: the existing MIA web app as documented in `product-map.md`, `routes-and-pages.md`, `user-journeys.md`, `components-inventory.md`. Problem-by-problem detail is in `ux-issues.md`; this document gives method, evidence base, per-dimension assessment and measurements.

No code was changed. No visual solutions are proposed; proposals in `ux-issues.md` are behavioral/UX direction only.

## 1. Method and evidence base

| Source | What it provides | Limits |
|--------|------------------|--------|
| Live app, Chromium via Playwright (scripts kept outside the repo) | Observed behavior, DOM measurements, 50+ screenshots (`observed/`), raw numbers (`observed/_ux-measurements.json`) | No real user, no screen reader, desktop pointer only, one browser |
| Source code (`src/`, `server.ts`) | Behavior not exercised (Focus mode internals, confirm sites, error handling) | Read, not run |
| Discovery documents | Product model, journeys, entities | Contained two errors corrected during this audit (see §8) |

Test conditions: viewports 1440×900 (all), 768×1024, 390×844, 320×844 (responsive); light and dark; **no `GEMINI_API_KEY`** so AI features ran on offline-fallback paths; seeded demo user "Juan / frecuente"; forced failures via request interception (`/api/chat` 500 and abort).

Evidence tags used throughout: **[OBS]** observed in browser · **[CODE]** read in source · **[HYP]** hypothesis.

What this audit is *not*: no usability test with people, no analytics, no accessibility audit with assistive technology, no performance review. Human-factors conclusions about "impact" are therefore expert judgment; each is labelled Confirmed (behavior) or Hypothesis (user belief/impact) in `ux-issues.md`.

## 2. Results at a glance

- **30 issues:** 2 P0, 8 P1, 14 P2, 6 P3. 21 fully confirmed, 5 hypotheses, 4 mixed (behavior confirmed, user impact hypothesized).
- **Strongest patterns**
  1. **Trust integrity:** the product's promise is grounded, verified answers; two flows contradict it with confident-looking content that isn't real (UX-01 failed chat shown as verified; UX-06 reservation "registered" with no record).
  2. **Accessibility is largely unbuilt:** non-focusable notebook cards, no dialog semantics, wrong language, tiny text, weak contrast in light mode.
  3. **Desktop-only layout:** overflow from 768 px down; primary navigation clipped on phones.
  4. **Orientation overhead:** repeated context and controls (three "Salir", duplicated metrics, redundant notebook labels, always-on header/footer).
  5. **Inconsistent patterns:** five feedback mechanisms, two theming approaches under the hood, ad-hoc modals, mixed vocabulary.
- **What works** (see "Positive findings" in `ux-issues.md`): a very short path into the product, solid empty-state guidance, a 3-click artifact creation with sensible defaults, confirmation before destructive actions, source citations, a visible loading state in Chat.

## 3. Assessment by dimension

Rating scale: **Good** / **Mixed** / **Weak** / **Poor**. Issue ids refer to `ux-issues.md`.

| # | Dimension | Rating | Key observations |
|---|-----------|--------|------------------|
| 1 | Information architecture | Mixed | Clear containment model (Folder → Notebook → Chat/Fuentes/Artefactos/Estudio) [OBS]. Overlapping "ask" surfaces (UX-22), unclear Pomodoro/Focus split (UX-07), account-level items (stats, plan) mixed with notebook-level content (UX-12, UX-28) |
| 2 | Navigation & orientation | Weak | Single URL, reload → Login (UX-08); section tabs live in the global header; notebook context repeated 3× (navbar pill, banner, Estudio subtitle); three "Salir" (UX-10). Positive: "Mis Carpetas" back path and active-tab highlight are clear |
| 3 | Content hierarchy | Weak | No `h1` outside Login (UX-17); 31–51 % of text is < 12 px (UX-04); many equal-weight chips and gradient buttons compete (header: ~11 controls) |
| 4 | Clarity of actions | Mixed | Primary actions are visually prominent (Empezar, Crear…, Elaborar…). Labels ambiguous in places: "Iniciar Concentración" ≠ Focus mode (UX-07), "Mejorar" (feedback vs improve) unclear, "Salir" ×3 (UX-10), "Bloqueos tab" unexplained (UX-12) |
| 5 | Steps to complete tasks | Good / Mixed | See §4. Short paths for the core value (3 clicks to create an artifact; 2 to ask a question). Long and hidden for Focus mode; organization actions need right-click (UX-19) |
| 6 | Interaction consistency | Weak | Modals behave differently; feedback via toast/alert/confirm/bubble (UX-13); theme switch duplicated; chat bubble implemented three times (inventory) |
| 7 | Forms & validation | Weak | Browser-native bubbles in the browser's language (UX-14); no inline errors; add-source and artifact forms not fully verified |
| 8 | System feedback | Weak | Chat loading state is good [OBS]. Failures: fabricated answer (UX-01), swallowed error (UX-13), silent persistence (UX-09), unsaved "reservation" (UX-06) |
| 9 | Empty / loading / error states | Mixed | Empty: good, clear CTAs, with minor duplication (UX-25), but copy mismatch ("Usuario nuevo" for a frequent user, UX-15). Loading: present in Chat; others not measured. Error: poor (UX-01, UX-13) |
| 10 | Accessibility | Poor | §5 |
| 11 | Responsive / mobile | Poor | §6 |
| 12 | Cognitive load & friction | Mixed | Dense headers and chips; 23-option artifact panel (UX-26); duplicated metrics; test controls visible (UX-15). Mitigated by defaults and strong empty-state guidance |

## 4. Task analysis (clicks measured on the seeded account)

| Task | Path | Steps | Notes |
|------|------|-------|-------|
| Enter the app | Empezar | 1 | No credentials |
| Open an existing notebook | card click | 2 from load | Keyboard path blocked for foldered notebooks (UX-02) |
| Ask a question | type + Enter | 1 action + typing | Chat is the default tab [OBS]; response includes citations. Failure path is misleading (UX-01) |
| Create a Quiz | ARTEFACTOS → Quiz → Elaborar | 3 from open notebook (5 from load) | Viewer auto-opens; defaults prefilled |
| Start a 25-min timer | ESTUDIO → Pomodoro tab → Iniciar ciclo → Iniciar Concentración | 4 from notebook (6 from load) | Focus mode is a separate, lower button (UX-07) |
| Create a notebook | + Nuevo Cuaderno → name → Crear | 3 | Native validation (UX-14); opens straight into Chat |
| Move a notebook to a folder | right-click → folder | 2 | Right-click only for foldered ones (UX-19) |
| Add a source | FUENTES → Manual/Enlace → type tab → fields → Guardar | ≥ 4 | Upload/drag-drop not exercised |
| Log out | Salir (header) | 1 | One of three "Salir" (UX-10); unreachable on phones without scrolling (UX-03) |

Observation: the product's core value path is short. Friction concentrates in navigation clarity, error handling and device/assistive-tech reach, not in the number of steps.

## 5. Accessibility measurements (automated + manual; desktop 1440 px)

| Check | Result |
|-------|--------|
| Document language | `lang="en"` on a Spanish UI |
| `h1` per screen | Login 1; Explorer, Chat, Fuentes, Artefactos, Estudio 0 |
| `nav` landmark | 0 on every screen (`main`, `header` present) |
| Dialog semantics (`role=dialog`/`aria-modal`) | 0 found on any screen/overlay measured |
| Escape closes overlay | New Folder: no · Profile: no · Google Search agent: no |
| Notebook card focusability | `div`, no tabindex/role; no focusable control opens a foldered notebook |
| Unlabeled form controls (visible) | Explorer 1 · Chat 1 · Fuentes 0 · Artefactos 0 · Estudio 1 (a select) |
| Icon-only buttons named only by `title` | Explorer 2 · Chat 6 · Fuentes 6 · Artefactos 10 · Estudio 0 |
| Images without `alt` | 0 (all images have `alt`) |
| Text < 12 px (share of text nodes) | Explorer 31 % · Chat 47 % · Fuentes 37 % · Artefactos 51 % · Estudio 40 % · Login 43 % |
| Contrast below AA (approx., light mode) | Explorer 26 %* · Chat 22 % · Fuentes 14 % · Artefactos 28 % · Estudio 15 % (*overstated by image-banner artefacts); lowest ≈ 2.5:1 |
| Contrast below AA (approx., dark mode) | Explorer 5 % (4/77) · Chat 14 % (12/85) |
| Targets < 44 px | Explorer 12 · Chat 23 · Fuentes 31 · Artefactos 27 · Estudio 18 |
| Targets < 24 px | Chat 9 · Fuentes 2 · Artefactos 2 · Estudio 2 |
| Focus indicator | Default outline visible on buttons; search field showed `outline: none` (replacement indicator not verified) |
| Focus on modal open | Moves to first input (New Folder) |

Not tested: screen-reader announcements, focus trapping/return, reduced-motion, zoom 200 %, text spacing, color-blind simulation, keyboard operation of ⋮ menu, Focus mode keyboard lock.

## 6. Responsive measurements

Page horizontal overflow (document scroll width vs viewport):

| Viewport | Login | Explorer | Workspace (all tabs) | Tabs clipped | Fixed bottom area |
|----------|-------|----------|----------------------|--------------|-------------------|
| 768 × 1024 | fits | fits | 882 px (overflow 114) | none | 83 px + 48 px button |
| 390 × 844 | fits | 456 px | 521 px | ARTEFACTOS, ESTUDIO | 79 px + 48 px button |
| 320 × 844 | 362 px | 456 px | 521 px | ARTEFACTOS, ESTUDIO | 90 px + 48 px button |

At 390 px the header shows only the back control, the theme switch and a Google icon; "Soporte IA", username, metrics and "Salir" sit outside the viewport [OBS `ux-71-chat-390.png`]. The floating Support button overlaps the chat input row (`52-chat-mobile.png`).

## 7. Cross-cutting observations

- **The product speaks with authority.** "Respuestas Verificadas", "Citas Verificables", "Sin alucinaciones", "formalmente registrada en el sistema". Because the visual language of certainty is permanent, any failure path that reuses it (UX-01, UX-06) is disproportionately harmful.
- **Demo scaffolding is part of the production UI.** "Modelado", "Datos de prueba", "A modo de prueba", a login without credentials and plan labels without plans. Whether this is a demo or a product needs to be decided before redesign, because it determines which screens exist at all.
- **State lives in the browser.** No accounts, no server persistence, no URLs. This shapes what a redesign can promise (sync, sharing, deep links, recovery).
- **Two parallel user populations are implied by the code** (`frecuente`, `nuevo`) but only one can be reached; the first-run experience is effectively untested by design.

## 8. Corrections to the discovery documents (made during this audit)

1. `components-inventory.md` said no confirmation dialogs were observed for deletes. Wrong: six sites use native `confirm()` and three were observed firing. Fixed.
2. `user-journeys.md`, `routes-and-pages.md`, `product-map.md` attached Focus mode to "Iniciar Concentración". Wrong: that button only starts the timer; Focus mode is a separate button. Fixed. (This misreading is itself evidence for UX-07.)

## 9. Open questions for the product owner (answers change severities or scope)

1. Is mobile a primary platform? (UX-03 P1 vs P0)
2. Is this a demo/pilot or a product? (UX-15, UX-28, UX-06, login)
3. What must survive a reload, and is cross-device sync intended? (UX-08, UX-09)
4. Are accessibility standards a requirement (institutional/legal)? (UX-02, UX-04, UX-05, UX-17)
5. Should reservations be real? (UX-06)
6. Is a graceful-offline answer intended, or should failures just fail? (UX-01)
