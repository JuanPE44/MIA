# Improved User Journeys

Status: **proposal, not approved**. Baseline: `audit/user-journeys.md` (J1–J13) and click counts in `audit/ux-audit.md` §4. Structure and labels: `information-architecture.md` (assumptions A1–A7, † = glossary to validate). Section rationale: `ux-proposal.md` §4.

Step counts are counted from the seeded account. "Now" counts are measured [OBS]; "Proposed" counts are design targets.

## Summary

| Journey | Now | Proposed | Main change |
|---|---|---|---|
| J1 Enter the app | 1 click; reload → Login | 1 click; reload → Login (A3) | First-run choice |
| J2 Move a notebook to a folder | 2 (right-click only) | 3 (visible menu → Mover a… → folder) | Reachable by touch and keyboard |
| J3 Create a notebook | 3 → opens empty Chat | 3 → opens Fuentes with "Añadir fuente" | Lands on the next useful step |
| J4 Add a source | ≥ 4 (two entry buttons) | 3 (Añadir fuente → type → Guardar) | One entry, upload incl. camera |
| J5 Ask a question | 1 + typing | 1 + typing | Honest failure, formatting, multiline |
| J6 Create a Quiz | 3 from notebook | 3 (Materiales → Cuestionario → Generar) | Options behind "Personalizar" |
| J7 Read / adjust a material | 1–2 | 1–2 | Addressable viewer, clear "Ajustar" |
| J8 Start a protected 25-min session | 6 from load (+ separate Focus button) | 4 from load, protection chosen up front | One start, visible state |
| J9 Recall / flashcards / progress | 2–3 | 2–3; progress in Progreso | Global vs notebook split |
| J10 Web info → notebook | Open global agent → search → "Al Cuaderno" | Fuentes → Añadir fuente → Desde la web → Añadir | In-context |
| J11 Ask for tutoring | Chips → "registrada" card | Chips → "Solicitud enviada" card | No false confirmation |
| J12 Edit profile / reset data | Bottom bar → modal | Account menu → Perfil / Preferencias | Escape, URL, separated demo |
| J13 Theme / sign out | "Blanco/Negro"; "Salir" ×3 | Account menu: Tema, Cerrar sesión | Distinct naming |
| New: J14 Check my progress | Scattered across 3 places | Top-bar chip → Progreso | One place |
| New: J15 Recover after errors | Fake answer; silent failures | Retry; visible failures | Trust |

---

## J1 — Enter the app

**Now:** Open `/` → Login → "Empezar" → Explorer. Reload always returns to Login. `nuevo` path unreachable.

**Proposed:**
1. First visit with no data: "Bienvenido/a a MIA" → **Empezar desde cero** or **Probar con datos de ejemplo** (A2).
2. Returning: "¡Hola de nuevo, <nombre>!" → **Empezar** → last location (or Mis cuadernos).
3. Reload: back to Bienvenida (A3); data kept in localStorage.

**Changes:** first-run reachable; theme follows system.
**Keeps:** single obvious action, theme switch, greeting.

## J2 — Browse and organize notebooks

**Now:** Folder banners stack; move/delete via right-click; foldered cards not keyboard-reachable.

**Proposed:**
1. Mis cuadernos → filter chip `Todos / <Carpeta> / Sin carpeta` or search.
2. Card "Más opciones" → **Mover a…** → choose folder (or "Sin carpeta") → toast "Movido a <Carpeta> · Deshacer".
3. Delete: "Más opciones" → Eliminar → dialog stating what is lost → toast with "Deshacer".
4. Desktop extra: drag card onto a folder chip.

**Edge states:** empty folder → "Esta carpeta está vacía · Crear cuaderno aquí"; search with no results → clear search action.
**Changes:** UX-02, UX-19, UX-24.
**Keeps:** folders (icon/cover), move in/out, delete with confirmation, search, totals.

## J3 — Create a notebook

**Now:** "+ Nuevo Cuaderno" → modal → "Crear Cuaderno" → empty Chat telling the user to add sources (duplicated in Fuentes).

**Proposed:**
1. "Nuevo cuaderno" (folder preselected if inside a folder filter).
2. Title (required, inline Spanish error), subject, folder, description, icon → **Crear cuaderno**.
3. Lands on **Fuentes** with the "Añadir fuente" dialog suggested (one CTA, no duplicate messages).

**Changes:** UX-14, UX-25; next step is the one that unlocks value.
**Keeps:** all fields, icon choice, folder selection.

## J4 — Add and understand sources

**Now:** Two buttons → same modal with 3 types → fields → "Guardar Fuente" → toast → processing.

**Proposed:**
1. "Añadir fuente" (notebook header, any section).
2. Choose **Archivo** (drop / picker / camera) · **Enlace** · **Texto** · **Desde la web**.
3. Fill → **Añadir**. Row appears with status "Analizando…" → "Lista" (or "Error · Reintentar").
4. Optional: row menu → **Ver análisis**; top panel "Resumen del cuaderno".
5. Control grounding with the row switch **Usar en el chat** (or "Usar todas / Ninguna").
6. Next step: "Crear resumen" / "Crear otro material" / "Preguntar en el chat".

**Edge states:** file too large for this browser → warning before saving; save failure → persistent message (UX-09); extraction failure → row error with retry.
**Changes:** one entry point, explicit status per source, web search inside the flow.
**Keeps:** all types, drag-and-drop, per-source and notebook analysis, select for chat, ask, delete.

## J5 — Ask questions about the material

**Now:** Type → Enter → answer with citations. On failure: fabricated "verified" snippet. Literal `**`. Duplicate "+ Iniciar chat", three "Salir".

**Proposed:**
1. Notebook opens on Chat (if it has sources). Composer shows "Fuentes activas: 3 de 3".
2. Type (Shift+Enter for new line) → Enter.
3. "Pensando…" → answer with formatting and citation chips → chip opens the inspector.
4. Feedback: 👍 / 👎 / **Comentar respuesta**.
5. Optional: **Crear un material con esto**, **Buscar en la web** (same question), **Nuevo chat** (threads panel).

**Failure path (new):** "No pude responder. Tu pregunta quedó guardada." → **Reintentar**. No citations, no "verificado". If offline mode is kept (A6): bubble labelled "Respuesta sin IA" with distinct styling.
**Phone:** threads in a "Chats" sheet; composer pinned at bottom; no floating buttons.
**Changes:** UX-01, UX-10, UX-13, UX-16, UX-21, UX-27, UX-30.
**Keeps:** threads, citations + inspector, feedback, Google hand-off, artifact suggestion.

## J6 — Generate a study material

**Now:** ARTEFACTOS → type → panel with ~23 options → primary button → viewer auto-opens.

**Proposed:**
1. Materiales† → **Cuestionario** (tile with description).
2. Quick sheet: sources (all active), length → **Generar**. (Optional **Personalizar**: Contenido / Estilo / Fuentes groups; last choices remembered.)
3. "Generando…" → viewer opens automatically.

**No sources:** tiles disabled with "Añade al menos una fuente" + button, no alert.
**Changes:** UX-26, UX-20, UX-13.
**Keeps:** 3-click path, 8 types, every option, source selection, auto-open.

## J7 — Consume / adjust a material

**Proposed:**
1. Materiales gallery → card **Abrir** (URL changes; Back closes).
2. Viewer: Lectura / Interactivo, zoom, Imprimir / PDF, Copiar, type interactions (quiz results, flip + hint, podcast, infographic).
3. **Ajustar material†** → describe what to change → new version replaces (or "Deshacer").
4. Eliminar → confirmation dialog → toast with Deshacer.

**Changes:** addressable viewer, clear refine label, consistent deletion.
**Keeps:** all viewer features, refine, delete.

## J8 — Start a protected study session

**Now (6 clicks from load):** ESTUDIO → "Pomodoro (Focus mode)" → "Iniciar ciclo pomodoro" → "Iniciar Concentración" (timer only) → scroll → "Focus mode". Test controls visible.

**Proposed (4 from load):**
1. Open notebook → **Estudiar** (lands on Sesión).
2. Setup card: 25 min / break 20 / 4 cycles (remembered); **Modo blindado** switch (on by default†) with explanation.
3. **Empezar sesión** → fullscreen (if blindado) → timer, "Estudio 1 de 4", badge "Modo blindado: activado".
4. Leaving the tab → warning + sound + counter (as today). **Salir del modo blindado** always visible; Tab/Escape work.
5. Break → micro-question with "Ver respuesta". Stage end → alarm, stats updated.
6. End → summary: minutes, sessions, tab exits → link "Ver progreso".

**Reload during session (A3):** session is not restored; the browser asks for confirmation before leaving while a session is running.
**Changes:** UX-07, UX-15, UX-23.
**Keeps:** configurable Pomodoro, Focus mode behaviors, alarm, micro-question, stats.

## J9 — Practice recall and flashcards; log progress

**Proposed:**
- Estudiar → **Repaso activo†** → "Generar pregunta" → answer → "Comparar con la respuesta" → "Otra pregunta".
- Estudiar → **Tarjetas** → flip / hint / previous / next → "La domino (+15 XP)".
- Weekly chart, goal and "+15 min / +25 min" → **Progreso** (J14).

**Changes:** notebook practice separated from global progress (UX-12).
**Keeps:** Active Recall, flashcards with XP, manual logging.

## J10 — Bring web information into a notebook

**Now:** Navbar "Google Search" (global overlay) → mode → ask → "Al Cuaderno". Escape does not close.

**Proposed:**
- From Fuentes: **Añadir fuente** → **Desde la web** → mode (Actualidad / Noticias con citas / Verificar un dato) → ask → result → **Añadir como fuente** → row appears "Analizando…".
- From Chat: **Buscar en la web** → same panel, question prefilled.

**Changes:** UX-22, UX-05, UX-29.
**Keeps:** 3 modes, suggestions, copy, open source, save to notebook.

## J11 — Get help or request tutoring

**Now:** "Soporte IA" or floating `?` → chips → reply + card "registrada en el sistema" (not stored).

**Proposed:**
1. **Ayuda** (top bar; phones: account menu).
2. Chips: Pedir tutoría, Pedir sala de estudio, Problema con un PDF, ¿Qué es el modo blindado?
3. Booking reply → card **"Solicitud enviada · pendiente de confirmación"** with what happens next; listed under "Mis solicitudes" for the session (A5).

**Changes:** UX-06, UX-21, UX-05.
**Keeps:** assistant, chips, card details (type, subject, date/time, host/room), reset, copy, context awareness.

## J12 — Manage profile and data

**Proposed:**
1. Account menu → **Perfil** → edit academic data → Guardar (inline confirmation).
2. Account menu → **Preferencias** → Tema; Datos: "Tus datos se guardan en este navegador" + **Restablecer datos de ejemplo** (confirmation dialog).

**Changes:** UX-05, UX-15, UX-28.
**Keeps:** profile fields, reset.

## J13 — Theme and sign out

**Proposed:** Account menu → **Tema: Claro / Oscuro / Sistema**; Account menu → **Cerrar sesión** → Bienvenida. Breadcrumb "Mis cuadernos" is the only way back from a notebook (no "Salir").
**Changes:** UX-10, UX-20.

## J14 (new) — Check my progress

1. Top-bar chip "55/60 min · 🔥6" → **Progreso**.
2. See today vs goal, streak, XP, total hours, sessions, mastered cards, tab exits (explained), weekly chart.
3. Change daily goal; log time manually.

**Changes:** UX-12, UX-11.

## J15 (new) — Recover from interruptions

| Interruption | Now | Proposed |
|---|---|---|
| Page reload | Login, place lost, timer reset, no warning | Same (A3), but warns before losing a running session |
| Chat request fails | Fabricated "verified" answer | Error bubble + Reintentar |
| Save to storage fails | Silent | Persistent "No se pudo guardar…" |
| Source analysis fails | Unverified | Row error + Reintentar |
| Accidental delete | Irreversible after `confirm()` | Toast "Deshacer" (8 s) |
| Back button | Leaves the app | Previous location in MIA |

## Device notes per journey

| Journey | Phone (< 640) specifics |
|---|---|
| J2 | Cards one column; "Más opciones" ≥ 44 px; move dialog full-screen |
| J4 | "Archivo" offers camera/gallery; drag-and-drop hidden |
| J5 | Threads sheet; composer pinned; keyboard does not cover send |
| J6–J7 | Customize as full-screen sheet; viewer full-screen, pinch zoom |
| J8 | Fullscreen request may be unsupported (iOS Safari): blindado degrades to warning-only, and says so |
| J11 | Ayuda full-screen, never floating over inputs |
