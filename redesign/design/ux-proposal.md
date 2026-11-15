# UX Improvement Proposal

Role: Lead Product Designer. Status: **proposal, awaiting owner approval**. No code or UI changed.
Inputs: `audit/product-map.md`, `audit/routes-and-pages.md`, `audit/user-journeys.md`, `audit/ux-audit.md`, `audit/ux-issues.md`. IA and assumptions A1–A7: `information-architecture.md`. Journeys: `improved-user-journeys.md`. Visual system: `design-tokens.md`, `component-patterns.md`.

## 1. Goals → how this proposal meets them

| Goal | Main moves |
|---|---|
| 1. Solve priority issues | Every P0/P1 has a concrete change (§3); P2/P3 mapped in §5 |
| 2. Simplify core flows | One-step session start; quick-create materials; one "Añadir fuente" entry |
| 3. Improve IA | Account-level Progreso; 3 navigation levels; one surface per question type |
| 4. Improve navigation | Addressable URLs, breadcrumb, distinct action names, no duplicate controls |
| 5. Reduce friction | Inline validation, visible notebook actions, no native dialogs, undo |
| 6. Content hierarchy | One `h1` per screen, chrome cut from ~22 % to ≤ 12 %, metrics in one place |
| 7. Keep all features | Feature retention matrix (§6): nothing removed, only moved or renamed |
| 8. All devices | Mobile-first layouts per section; bottom tabs on phones; dialogs → sheets |

## 2. Design principles (decision filters)

1. **Never fake certainty.** Verification affordances only on content produced and cited by the service (UX-01, UX-06).
2. **One name, one place per action.** No duplicates, no shared labels for different actions (UX-10, UX-12).
3. **Content over chrome.** Persistent UI only for what is needed on every screen (UX-11).
4. **Everything reachable by keyboard, touch and screen reader** (UX-02, 05, 17, 18, 19).
5. **Quick by default, deep on demand.** Defaults first, options behind "Personalizar" (UX-26).
6. **Say where data lives.** Saved / not saved is always knowable (UX-09).

## 3. Priority issues (P0 + P1)

| ID | Proposed resolution | Where |
|---|---|---|
| UX-01 P0 | Failed chat = error bubble "No pude responder" + "Reintentar", user message kept, **no citations or "verificado" styling**. Offline/heuristic content only with a distinct "Respuesta sin IA" label (A6). Remove the permanent "Sin alucinaciones" promise under the input; show grounding info per answer instead | Chat §4.3 |
| UX-02 P0 | Every notebook card is a single focusable link; "Más opciones" button on every card (inside folders too) | Explorer §4.2 |
| UX-03 P1 | Mobile-first layouts, no horizontal scroll at 320 px, bottom tab bar for the 4 sections, account actions in one menu | All, IA §5 |
| UX-04 P1 | Minimum text 14 px for content, 12 px only for non-essential meta; contrast ≥ 4.5:1 in both themes (tokens already corrected) | All |
| UX-05 P1 | One dialog behavior: announced, Escape closes, focus trapped and returned; full-screen sheets on phones | All overlays |
| UX-06 P1 | Support flow produces a **"Solicitud enviada (pendiente de confirmación)"** card, never "registrada en el sistema"; requests listed in Ayuda for the session (A5) | Ayuda §4.8 |
| UX-07 P1 | Single "Empezar sesión" with a visible "Modo blindado" switch before start; persistent indicator "Blindado: activado/desactivado" during the session | Estudiar §4.6 |
| UX-08 P1 | Addressable locations if A7 is approved; no state restore on reload by owner decision (A3). Reload must at least warn before losing a running session ("¿Salir? Perderás la sesión en curso") | IA §4 |
| UX-09 P1 (hyp.) | Save status indicator; explicit error "No se pudo guardar <x> en este dispositivo" with guidance; file-size warning on upload; copy that data lives in this browser | Global, Fuentes |
| UX-10 P1 | "Cerrar sesión" only in account menu; breadcrumb replaces both "Salir" back controls; one "Nuevo chat" | Global, Chat |

## 4. Section by section

Format per section: **Current problems → Proposed experience → Rationale → Navigation changes → Journey changes → Must keep**.

### 4.1 Bienvenida (Login)

- **Current problems:** No choice of data mode (`nuevo` unreachable, J1); "Juan" hard-coded; reload always returns here (UX-08); overflows at 320 px (UX-03).
- **Proposed experience:** Same single-screen welcome. Primary "Empezar" (continues with saved data). If there is no saved data: two choices, "Empezar desde cero" and "Probar con datos de ejemplo" (A2). Theme follows system by default; switch kept. Reload returns here (A3: no session restore); data is kept in localStorage.
- **Rationale:** Keeps the strongest positive finding (one obvious action) while exposing both existing data modes.
- **Navigation:** `/` → `/cuadernos`.
- **Journeys:** J1 (2 steps → 1; first-run path made reachable).
- **Must keep:** One-click entry, theme switch, greeting with the student's name.

### 4.2 Mis cuadernos (Explorer)

- **Current problems:** Cards not keyboard-reachable (UX-02); right-click-only actions (UX-19); "Perfil Frecuente (Modelado)" and "Usuario nuevo" copy (UX-15); no `h1` (UX-17); 456 px overflow on phones (UX-03); native validation in English (UX-14); `confirm()` deletes (UX-24).
- **Proposed experience:**
  - `h1` "Mis cuadernos", search, "Nuevo cuaderno" (primary), "Nueva carpeta" (secondary).
  - Filter chips by folder; grid of notebook cards (title, subject, folder, sources count, last activity). Card = link; "Más opciones" button always visible: Abrir, Renombrar, **Mover a…** (dialog listing folders + "Sin carpeta"), Eliminar.
  - Optional drag-and-drop to a folder chip on desktop, never the only way.
  - Folder actions in the folder's own menu: Renombrar, Cambiar ícono/portada, Eliminar (states that notebooks are kept, already good).
  - Create notebook dialog: title required with inline Spanish error; folder preselected when created from inside a folder; icon choice kept.
  - Delete = app dialog stating consequences + "Deshacer" toast for 8 s.
- **Rationale:** Removes the only P0 blocker at product entry; makes organization discoverable on touch; filtering scales better than stacked folder banners.
- **Navigation:** Home of the app. Folder filter is addressable (`?carpeta=`). Opening a notebook goes to its last-used section (default Chat if it has sources, Fuentes if empty).
- **Journeys:** J2, J3 (move notebook from right-click to visible menu; create goes to Fuentes when empty).
- **Must keep:** Folders with icon + cover, loose notebooks, search, totals, move in/out of folders, delete with confirmation, empty-folder CTA.

### 4.3 Cuaderno → Chat

- **Current problems:** Fabricated "verified" answer on failure (UX-01) and swallowed error at a second call site (UX-13); Markdown not rendered (UX-16); single-line input (UX-27); "+ Iniciar chat" ×2 and "Salir" ×3 (UX-10); FAB covers input on phones (UX-21); last thread deletion via alert (UX-30); 47 % of text < 12 px (UX-04); 9 targets < 24 px (UX-18).
- **Proposed experience:**
  - Layout: threads panel (desktop left column; phone sheet from a "Chats" button) + conversation.
  - Threads panel: "Nuevo chat" (only one), list with rename/delete in a per-thread menu. Deleting the last thread creates an empty "Chat 1" automatically instead of an alert.
  - Composer: multi-line field (Enter sends, Shift+Enter new line), visible label, send button, "Fuentes activas: 3 de 3" link opening Fuentes, secondary "Buscar en la web".
  - Answers: rendered formatting (defined subset: bold, italics, lists, headings, code); citations as chips → citation inspector; per-answer 👍/👎/"Comentar respuesta".
  - States: empty notebook (single CTA "Añadir fuentes"), thinking, answered, **error with retry**, "Respuesta simulada" (labelled; this is the default while AI is mocked, A2).
  - Suggestion "Crear un material con esto" kept as an inline action under relevant answers.
- **Rationale:** Restores the product's core promise; reduces duplicate controls; mobile layout puts the composer at the bottom with no overlays.
- **Navigation:** Thread is addressable; "Fuentes activas" links to Fuentes; "Buscar en la web" opens the web search with the question prefilled.
- **Journeys:** J5, J10.
- **Must keep:** Multiple threads (new, switch, rename, delete), citations + inspector, feedback 👍/👎/comment, Google hand-off, artifact suggestion, sources-selected count, loading state, disabled empty send.

### 4.4 Cuaderno → Fuentes

- **Current problems:** Two add buttons ("Cargar de Galería / Fotos", "Manual / Enlace") leading to the same 3-type modal; empty guidance duplicated with Chat (UX-25); 31 targets < 44 px (UX-18); `confirm()` delete (UX-24); upload/extraction failures unverified; persistence risk for base64 files (UX-09).
- **Proposed experience:**
  - One primary "Añadir fuente" → dialog with 4 options: **Archivo** (drag-and-drop + picker, incl. camera/gallery on phones), **Enlace**, **Texto**, **Desde la web** (web search, results → "Añadir como fuente").
  - Source list rows: type icon, title, status (Analizando… / Lista / Error con "Reintentar"), switch "Usar en el chat" (replaces checkboxes; bulk "Usar todas / Ninguna"), menu (Ver análisis, Preguntar en el chat, Eliminar).
  - Notebook analysis as a collapsible "Resumen del cuaderno" panel at the top (topic, subtopics, concepts, authors, structure, evaluation points) with "Volver a analizar".
  - Next-step CTAs after the list: "Crear resumen", "Crear otro material".
  - Upload: size shown; warning when a file is likely too large to store in this browser; save failure surfaced (UX-09).
- **Rationale:** One entry, clear per-source state, explicit control of chat grounding.
- **Navigation:** From notebook header "Añadir fuente" (any section) opens the dialog directly. "Preguntar en el chat" → Chat with prompt.
- **Journeys:** J4, J10.
- **Must keep:** All source types (text/pdf/link/image/video/audio), drag-and-drop, per-source AI analysis, notebook analysis, select for chat, delete, "Preguntar", create-artifact CTAs, processing toast (as status).

### 4.5 Cuaderno → Materiales† (Artefactos)

- **Current problems:** ~23 options per creation (UX-26); 51 % of text < 12 px; 10 icon-only buttons named by `title` (UX-17); "Mejorar" ambiguous; abbreviated/English type names (UX-20); `alert()` when no sources (UX-13).
- **Proposed experience:**
  - Top: "Crear material" with 8 type tiles (full Spanish names + one-line description).
  - **Quick create**: choosing a type opens a short sheet: sources used (default: all active), length, **"Generar"**. A "Personalizar" disclosure reveals the rest grouped: *Contenido* (quality, format, length), *Estilo* (keep titles, highlight authors + color, examples, graphics, index), *Fuentes* (cite sources, edit selection).
  - Remember last-used options per type.
  - Gallery of existing materials (type, title, date, sources used), each with Abrir, Ajustar material, Descargar/Imprimir, Eliminar.
  - Viewer full-screen (addressable): reading / interactive modes, zoom, print/PDF, copy, "Ajustar material" with feedback field; type-specific interaction (quiz results, card flip + hint, podcast player, infographic).
  - No sources: type tiles disabled with inline reason + "Añadir fuentes" (kept from today, without alert).
- **Rationale:** Keeps the 3-click path and every option, but hides complexity until asked.
- **Navigation:** Viewer has its own URL; Back closes it.
- **Journeys:** J6, J7.
- **Must keep:** 8 types, all personalization options, source selection, auto-open after generation, both viewer modes, zoom, print/PDF, copy, refine, delete, quiz/flashcard/podcast interactions.

### 4.6 Cuaderno → Estudiar

- **Current problems:** Focus mode hidden and mislabelled (UX-07); test-speed controls visible (UX-15); global stats inside a notebook and repeated elsewhere (UX-12); "bloqueos tab" unexplained; Focus mode may lock Tab/Escape (UX-23); 4 sub-tabs mixing global progress and notebook practice.
- **Proposed experience:** Three sub-sections:
  1. **Sesión** — one setup card: study length (20/25/30), long break (15/20/25/30), cycles (4), **switch "Modo blindado"** with one-line explanation ("pantalla completa y aviso si cambias de pestaña"). Single button **"Empezar sesión"**. During a session: large timer, stage label ("Estudio 1 de 4"), Pausar / Terminar, session log, micro-question in breaks, persistent badge "Modo blindado: activado". Exit always visible; Tab and Escape never locked (A4). Test-speed controls only in a developer/demo flag (A2).
  2. **Repaso activo†** — generate challenge → answer → compare with reference answer → next.
  3. **Tarjetas** — flip, previous/next, hint, "La domino (+15 XP)".
- Weekly chart, daily goal and manual "+15m / +25m" move to **Progreso** (§4.7); a small "Hoy: 55 / 60 min" link remains.
- **Rationale:** The differentiating promise must be chosen consciously and visible while active; global metrics stop competing with notebook practice.
- **Navigation:** Sub-sections addressable; Modo blindado hides L1/L2 chrome (as today) and shows only session controls.
- **Journeys:** J8 (6 clicks from load → 4, and protection state explicit), J9.
- **Must keep:** Pomodoro cycle and configurable durations, alarm, Focus mode (fullscreen, visibility warning, sound, tamper counter — renamed "Salidas de la pestaña"), micro-question, Active Recall, Flashcards with mastery and XP, stats updates.

### 4.7 Progreso (new account-level page)

- **Current problems:** Metrics in navbar, bottom bar, Estudio tiles and Profile in different formats (UX-12); unclear global vs notebook scope.
- **Proposed experience:** `h1` "Tu progreso": today vs daily goal, streak, XP, total focus hours, sessions completed, flashcards mastered, tab exits during Modo blindado (explained); weekly chart; daily goal select; manual log "+15 min / +25 min"; optional breakdown by notebook (future, data not tracked today).
- **Rationale:** One canonical place and format; makes clear the numbers are for the whole account.
- **Navigation:** L1 link + "today" chip in the top bar (single metric: "55/60 min · 🔥6").
- **Journeys:** J9 (weekly progress), new "check my progress" journey.
- **Must keep:** Every stat and the weekly chart, goal selection, manual logging.

### 4.8 Ayuda (Support agent)

- **Current problems:** False booking confirmation (UX-06); FAB overlaps input (UX-21); separate "ask" surface without framing (UX-22); Escape/dialog semantics (UX-05).
- **Proposed experience:** Ayuda page/panel with: the support assistant (same quick actions), short FAQ (incl. "¿Qué es el modo blindado?"), "Mis solicitudes" for the session. Booking replies render as **"Solicitud enviada — pendiente de confirmación"** with what happens next, unless real bookings are built (A5). Context (current notebook/section) still passed to the assistant.
- **Rationale:** Keeps the useful assistant, removes the false claim, and gives help a predictable place.
- **Navigation:** L1 "Ayuda"; on desktop opens as a side panel that does not cover inputs; on phones full-screen.
- **Journeys:** J11.
- **Must keep:** Quick chips (tutoring, study room, PDF problem, Focus mode), conversation, reset, copy, minimize (desktop panel), context awareness.

### 4.9 Buscar en la web (Google Search agent)

- **Current problems:** Separate overlay from navbar; Escape does not close (UX-05); status dot unexplained (UX-29); overlapping purpose with Chat (UX-22).
- **Proposed experience:** Lives inside a notebook: Fuentes → "Añadir fuente" → "Desde la web", and Chat → "Buscar en la web". Modes kept as a segmented control (Actualidad, Noticias con citas, Verificar un dato). Results: Copiar, Abrir fuente, **Añadir como fuente**. Remove the status dot; if the service is unavailable, show it as a state in the panel.
- **Rationale:** The main outcome of the agent is adding material to a notebook; placing it there removes one global "ask" surface.
- **Navigation:** No longer in the global bar. Opened as a dialog/sheet from the notebook.
- **Journeys:** J10.
- **Must keep:** 3 modes, suggested prompts, copy, open source, save to notebook.

### 4.10 Cuenta (Profile, preferences, session)

- **Current problems:** Profile behind a fixed bottom bar; plan labels without functionality (UX-28); "Restablecer datos de prueba" mixed with profile (UX-15); Escape fails (UX-05); theme switch duplicated.
- **Proposed experience:** Account menu (avatar, top-right): Perfil, Preferencias, Progreso (phones), Ayuda (phones), Cerrar sesión. **Perfil**: academic data form. **Preferencias**: Tema (Claro/Oscuro/Sistema), Datos (where data is stored, "Restablecer datos de ejemplo" with confirmation). Plan section **hidden** until a plan exists (owner decision).
- **Rationale:** Account items out of the study workspace; demo controls grouped and explained.
- **Navigation:** `/cuenta/perfil`, `/cuenta/preferencias`.
- **Journeys:** J12, J13.
- **Must keep:** Profile fields (name, degree, university, term, avatar seed), theme light/dark persisted, data reset, logout.

### 4.11 Cross-cutting systems

| System | Proposal | Issues |
|---|---|---|
| Feedback | 4 patterns only: inline field error; toast (success/info, with undo when relevant); persistent banner/inline with retry (failures); confirmation dialog (destructive). No `alert`/`confirm`/native bubbles | UX-13, 14, 24, 30 |
| Dialogs | One primitive (role, Escape, focus trap/return); phones: full-screen sheet | UX-05 |
| Semantics | `lang="es"`, one `h1` per screen, `nav`/`main` landmarks, labelled fields, named icon buttons | UX-17 |
| Targets | ≥ 44 × 44 touch, ≥ 24 × 24 pointer minimum, ≥ 8 px between destructive and other actions | UX-18 |
| Persistence | Save status and errors surfaced; no reload restore (A3) | UX-08, 09 |
| Simulated AI | While AI is mocked (A2), every AI output (chat, analysis, materials, recall, search, support) carries a visible "Simulado" label; no verification affordances on simulated content | UX-01 |
| Demo content | Behind one "Datos de ejemplo" mode; test controls behind a dev flag | UX-15 |
| Language | Spanish-first glossary (IA §7) | UX-20 |
| Theming | One mechanism, light + dark + system (owner decision) | Audit §2 pattern 5 |

## 5. Full issue coverage

| ID | P | Resolved in |
|---|---|---|
| UX-01 | P0 | 4.3 |
| UX-02 | P0 | 4.2 |
| UX-03 | P1 | IA §5, all sections |
| UX-04 | P1 | 4.11, tokens |
| UX-05 | P1 | 4.11 |
| UX-06 | P1 | 4.8 |
| UX-07 | P1 | 4.6 |
| UX-08 | P1 | IA §4 |
| UX-09 | P1 | 4.4, 4.11 |
| UX-10 | P1 | IA §5.3, 4.3 |
| UX-11 | P2 | IA §5.2 |
| UX-12 | P2 | 4.7 |
| UX-13 | P2 | 4.11 |
| UX-14 | P2 | 4.2, 4.11 |
| UX-15 | P2 | 4.1, 4.6, 4.10 |
| UX-16 | P2 | 4.3 |
| UX-17 | P2 | 4.11 |
| UX-18 | P2 | 4.11 |
| UX-19 | P2 | 4.2 |
| UX-20 | P2 | IA §7 |
| UX-21 | P2 | IA §5.2, 4.8 |
| UX-22 | P2 | IA §5.4, 4.9 |
| UX-23 | P2 | 4.6 |
| UX-24 | P2 | 4.2, 4.11 |
| UX-25 | P3 | 4.3, 4.4 (single next step per screen) |
| UX-26 | P3 | 4.5 |
| UX-27 | P3 | 4.3 |
| UX-28 | P3 | 4.10 |
| UX-29 | P3 | 4.9 |
| UX-30 | P3 | 4.3 |

## 6. Feature retention matrix

Nothing is removed. "Moved" = same capability, new location.

| Feature (product-map §3) | Status |
|---|---|
| Enter, logout, theme, reset data | Kept; logout/theme/reset moved to account menu / Preferencias |
| Folders: create/delete, icon, cover | Kept; + rename (menu) |
| Notebooks: create, open, move, delete, search | Kept; move via visible "Mover a…" |
| Chat threads: new/switch/rename/delete | Kept; last-thread rule changed (auto-create) |
| Cited answers, inspector, feedback, Google hand-off, artifact suggestion | Kept; failure presentation changed |
| Sources: all types, drag-drop, analysis, select for chat, ask, delete | Kept; single entry |
| Notebook analysis | Kept (collapsible panel) |
| 8 artifact types, all options, viewer modes, zoom, print, copy, refine, delete | Kept; options behind "Personalizar" |
| Pomodoro cycle, config, alarm, micro-question | Kept; single start |
| Focus mode (fullscreen, warning, sound, counter) | Kept; explicit switch + indicator; no Tab/Escape lock |
| Test-speed controls | Kept behind dev/demo flag |
| Active Recall, Flashcards (+XP) | Kept |
| Weekly chart, goal, manual log, all stats | Moved to Progreso |
| Google Search agent (3 modes, save to notebook) | Moved into notebook (Fuentes / Chat) |
| Support agent (chips, reservation card, reset, copy) | Moved to Ayuda; card reworded |
| Profile (2 tabs) | Moved to Cuenta |

## 7. Responsive strategy (A1)

| Width | Layout |
|---|---|
| < 640 | 1 column; top bar (logo, today chip, account); notebook bottom tab bar; threads and dialogs as full-screen sheets; composer pinned at bottom; no floating buttons in the workspace |
| 640–1023 | 2-column grids; top tab bar for sections; threads as overlay panel |
| ≥ 1024 | Threads panel persistent; side panel for Ayuda; grids up to 4 columns |
| All | No horizontal page scroll down to 320 px; 200 % zoom usable; touch targets ≥ 44 |

## 8. Validation plan (before and after build)

| Test | Covers | Success signal |
|---|---|---|
| First-click test (8 users): "volver a tus cuadernos", "cerrar sesión", "agregar una noticia a tu cuaderno" | UX-10, 22 | ≥ 80 % correct first click |
| Task test on phone (5 users): open notebook → Materiales → ask a question | UX-03 | 5/5 without horizontal scroll |
| Keyboard + screen reader walkthrough (2 users) | UX-02, 05, 17, 23 | All core tasks completed |
| "Empezar una sesión protegida de 25 min" (5 users) | UX-07 | Users correctly state whether protection is on |
| Card sort of labels (8 users) | UX-20 | Glossary † items confirmed or replaced |
| Forced chat failure (5 users): "¿qué pasó?" | UX-01 | Users understand no answer was given |
| Storage stress test with real PDFs | UX-09 | Failure surfaced, no silent loss |

## 9. Out of scope for this proposal

Visual design of each screen (next phase, using `design-tokens.md`), backend accounts/sync, real bookings, analytics. These depend on A2, A3, A5.

## 10. Suggested delivery order (when implementation is approved)

1. **Trust and access:** UX-01, UX-02, dialogs (UX-05), semantics (UX-17), naming (UX-10).
2. **Structure:** routes if A7 approved (UX-08), chrome reduction (UX-11), Progreso (UX-12), account menu.
3. **Mobile:** responsive layouts (UX-03, 18, 21).
4. **Flows:** session start (UX-07, 23), add source + web (UX-22), quick-create materials (UX-26).
5. **Polish:** feedback system, glossary, Markdown, multiline, demo flag (UX-13–16, 20, 24–30).
