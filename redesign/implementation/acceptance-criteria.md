# Acceptance Criteria

> **Revision 2 (lean plan, see `roadmap.md` R2).** While the automated suites are deferred: Definition of Done items 1 and 4 become "`pnpm lint` + `pnpm build` pass" and "manual keyboard/contrast check"; criteria that mention Vitest, Playwright, axe, Lighthouse, `rg` guards, `/__ui`, the contrast script, storage fixtures, the AI mock adapter or Vercel apply only when the deferred task is scheduled. All UX/UI criteria (behavior, accessibility, responsive, copy) still apply.

Status: **proposal, awaiting owner approval**. One section per task in `roadmap.md`. Specs referenced: `design/ui-specifications.md` (UI), `design/component-specifications.md` (CS), `design/screen-by-screen.md` (S#), `design/ux-proposal.md` (UXP), `audit/ux-issues.md` (UX-##).

## 0. Definition of Done (every task)

1. `npm run lint` (tsc + eslint) and `npm run test` pass; affected e2e specs pass.
2. No horizontal page scroll at 320, 390, 768, 1024, 1440 on touched screens.
3. Light and dark verified; all text ≥ 4.5:1 (≥ 3:1 large), controls/focus ≥ 3:1.
4. axe: 0 serious/critical violations on touched routes.
5. Keyboard: every new interactive element reachable, operable, with visible focus.
6. No feature from the retention matrix (UXP §6) removed.
7. No new `alert()`, `confirm()`, `title`-only button, hard-coded color or `isDarkMode` prop.
8. `server.ts` and `vite.config.ts` HMR logic untouched (D9).
9. Persisted shape changes go through the storage migration (key `_vN` bump).
10. Spanish UI copy follows the glossary; artifacts/code in English.

---

## M0 — Foundations

- **AC-T0.1** `npm run test` runs Vitest with jsdom and RTL; a smoke test renders the app; runs in < 30 s.
- **AC-T0.2** `npx playwright test` runs projects `phone-390`, `tablet-768`, `desktop-1440` × `light`, `dark`; axe helper available; uses the mock AI mode; one smoke spec passes.
- **AC-T0.3** Screenshots of Login, Explorer, Chat, Fuentes, Artefactos, Estudio (4 tabs), Profile, Support, Google agent saved as `redesign/screenshots/before/<screen>__<theme>__<width>.png`.
- **AC-T0.4** ESLint with `react-hooks` and `jsx-a11y` configured; new code has 0 errors; legacy files may be listed in an ignore/overrides block with a TODO tied to T6.1.
- **AC-T0.5** `<html lang="es">`; title "MIA — Mi Inteligencia Artificial"; favicon named `favicon.*`; `package.json` name `mia-app`.
- **AC-T0.6** `motion` removed if unused after T2.8, build passes.

## M1 — Tokens & theming

- **AC-T1.1** Every token in UI §2–4 exists as a CSS variable for light and dark and as a Tailwind utility; a script verifies listed contrast pairs meet UI §2.1 values; no hex colors outside `tokens.css`.
- **AC-T1.2** Plus Jakarta Sans loads from the app origin (no third-party request); fallback stack applied; Spanish diacritics render.
- **AC-T1.3** Theme: Claro / Oscuro / Sistema; "Sistema" follows OS changes live; persisted in `mia_theme_mode`; legacy values `light`/`dark` read correctly; `.dark` class set alongside `data-theme` during migration.
- **AC-T1.4** Focus ring per UI §8.3 on all focusable elements; `prefers-reduced-motion` disables transitions; old global color overrides removed without legacy screens losing readable text.

## M2 — Primitives

- **AC-T2.1** Button variants/sizes/states per CS §1.1–1.3; loading sets `aria-busy`; disabled-with-reason stays focusable; IconButton requires `aria-label` (type-level).
- **AC-T2.2** Fields per CS §2.1–2.4, 2.9: visible label, error via `aria-invalid` + `aria-describedby`, Spanish messages, 16 px input text; Textarea auto-grows to 8 rows.
- **AC-T2.3** Switch `role="switch"`; SegmentedControl `radiogroup` with arrow keys; hit area ≥ 44 on touch.
- **AC-T2.4** Dialog/Sheet: `role="dialog"`/`alertdialog`, `aria-modal`, labelled; Escape closes; focus trapped and returned; background scroll locked; Sheet below 640 px; ConfirmDialog initial focus on Cancelar.
- **AC-T2.5** Menu: opens with Enter/Space/↓, arrows/Home/End/typeahead, Escape returns focus; right-click opens the same menu; Sheet on phone.
- **AC-T2.6** Toast: one at a time, 5 s / 8 s with action, pauses on hover/focus, `role="status"`, undo callback works; InlineAlert 5 variants per CS §5.1.
- **AC-T2.7** Tabs show active state by underline + weight + color; overflow scrolls (no clipping); BottomTabBar 4 items with icon + label, hidden when keyboard open; Breadcrumb `aria-current`.
- **AC-T2.8** Card interactive pattern (single link + separate menu stop); Chip 4 variants; SimulatedBadge text "Simulado" + explanation popover; EmptyState single primary action.
- **AC-T2.9** FileDrop: drag-over state, button alternative, type/size shown; phone shows "Tomar foto"/"Elegir archivo"; IconPicker radiogroup with named swatches.
- **AC-T2.10** `/__ui` lists every primitive in all states, light/dark; excluded from production bundle.

## M3 — Data & services

- **AC-T3.1** Storage: typed API; v2 → v3 migration covered by fixtures (seed data + edge cases); v2 kept until v3 write succeeds; write failure emits `storage-error` with key and reason; no silent `catch`.
- **AC-T3.2** All handlers listed in `App.tsx` exist as tested actions with identical outcomes (create/move/delete folder/notebook/source/artifact/thread, select sources, stats update, reset demo). Deleting the last thread auto-creates "Chat 1" (UX-30).
- **AC-T3.3** `aiClient` covers 9 operations with typed request/response; server adapter sends the same payloads as today; errors normalized to `{kind: 'network'|'server'|'parse', message}`.
- **AC-T3.4** Mock adapter returns valid typed data for every operation, Spanish copy, latency 400–1200 ms, `simulated: true`; failure injection reproducible.
- **AC-T3.5** `VITE_AI_MODE` defaults to `mock`; documented; switching to `server` works locally with `npm run dev`.

## M4 — Shell & routing

- **AC-T4.1** All IA §4 URLs resolve; legacy components render inside them; Back/Forward move between locations; unknown routes → Not found (S13).
- **AC-T4.2** No session → Bienvenida; "Empezar" goes to the originally requested URL; reload shows Bienvenida again (A3); data preserved.
- **AC-T4.3** TopBar 56 px with ≤ 5 controls; TodayChip shows "min / meta" + streak and links to Progreso; "Cerrar sesión" exists once (UX-10); phone menu contains Progreso and Ayuda.
- **AC-T4.4** NotebookHeader shows breadcrumb, title (`h1`), sources count, "Añadir fuente", menu; 4 sections reachable at 320/390 via BottomTabBar without clipping (UX-03).
- **AC-T4.5** Legacy Navbar, bottom bar, banner and FAB gone; chrome ≤ 19 % of 1440×900 at top and ≤ 12 % after scroll (UI §5.2); no duplicate "Nuevo chat".
- **AC-T4.6** Storage error shows a persistent danger InlineAlert; browser offline shows info toast.
- **AC-T4.7** Vercel preview: refreshing `/cuadernos/<id>/chat` loads the app; env `VITE_AI_MODE=mock`.

## M5 — Screens

- **AC-T5.1** S1: returning user one primary action; first-run shows "Empezar desde cero" and "Probar con datos de ejemplo" producing empty vs seeded data.
- **AC-T5.2a** S2: every notebook card (inside or outside folders) focusable and opens with Enter (UX-02); search filters with announced count; folder filter chips; empty states per S2; no "Modelado"/"Usuario nuevo" copy.
- **AC-T5.2b** Create dialogs validate inline in Spanish (UX-14); "Mover a…" available from the visible menu on every card (UX-19); delete via ConfirmDialog + undo toast (UX-24).
- **AC-T5.3a** S4 layout per breakpoint; Enter sends, Shift+Enter newline (UX-27); Markdown subset rendered, no literal `**` (UX-16); thread rename/delete via menu; composer never covered (UX-21).
- **AC-T5.3b** Forced failure shows error variant + Reintentar, keeps the user message, shows **no** citations or verification text (UX-01); mock answers display SimulatedBadge; "Sin alucinaciones" footer removed.
- **AC-T5.4a** S5: per-source status (Analizando / Lista / Error + Reintentar); "Usar en el chat" switches with count; analysis panel collapsible; next-step CTAs present.
- **AC-T5.4b** One "Añadir fuente" entry (header + page); Archivo/Enlace/Texto/Desde la web; large-file warning; added source appears as "Analizando…".
- **AC-T5.5** S8: opened from Fuentes and from Chat (question prefilled); 3 modes; "Añadir como fuente" adds to the current notebook; Escape closes; no status dot.
- **AC-T5.6a** S6: 8 type tiles with Spanish names; quick-create in ≤ 3 clicks from Materiales; all ~23 options reachable under Personalizar and remembered per type; closing the sheet during generation keeps generating (card "Generando…"); no `alert()` when no sources.
- **AC-T5.6b** Viewer at `/materiales/:id`; Back/Escape close; Lectura/Interactivo, zoom, print, copy, "Ajustar material" with undo; SimulatedBadge.
- **AC-T5.6c** Quiz results, flashcard flip + hint, podcast player, infographic render with parity to current behavior (characterization tests).
- **AC-T5.7a** S7a/S7b: one "Empezar sesión" (UX-07); durations configurable; pause/terminar; stage changes announced; break micro-question; summary at end; test-speed controls absent unless dev flag (UX-15); leaving the page during a session asks for confirmation.
- **AC-T5.7b** Modo blindado switch default on; indicator visible during session; fullscreen requested; tab-leave warning + sound + counter; exit always visible and keyboard-reachable; Tab/Escape never blocked (UX-23); unsupported fullscreen → info alert.
- **AC-T5.7c** Repaso activo flow per S7c; Tarjetas flip/keyboard, "La domino (+15 XP)" updates stats.
- **AC-T5.8** S9: all stats in one place with consistent formats (UX-12); chart has an accessible table; goal change and manual log persist with undo.
- **AC-T5.9** S10: request flow shows "Solicitud enviada · pendiente de confirmación" and the note that nothing real is booked (UX-06); never "registrada en el sistema"; works as page and side panel.
- **AC-T5.10** S11: Perfil saves with inline confirmation; Preferencias theme + reset example data with ConfirmDialog; plan labels hidden (UX-28).

## M6 — Hardening & release

- **AC-T6.1** No legacy component files, no `isDarkMode` prop, no `focused_*_v2` writes; `rg` guards in `npm run lint`.
- **AC-T6.2** axe 0 serious/critical on all routes × themes; keyboard walkthrough of J1–J14 recorded; VoiceOver smoke for login, open notebook, ask, start session.
- **AC-T6.3** "After" screenshot set complete; all routes pass the responsive matrix and 200 % zoom.
- **AC-T6.4** Banned-strings guard (Modelado, A MODO DE PRUEBA, Blanco/Negro, registrada en el sistema, Sin alucinaciones) passes.
- **AC-T6.5** Lighthouse (mobile, preview) ≥ 90 performance and ≥ 95 accessibility on Mis cuadernos and Chat.
- **AC-T6.6** Production deploy on Vercel in mock mode; README documents run, test, deploy and `VITE_AI_MODE`.
