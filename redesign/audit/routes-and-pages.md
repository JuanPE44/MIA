# Routes and Pages

Evidence legend: **[OBS]** observed by running the app in a browser · **[CODE]** read in source · **[INF]** inferred, not verified.

## How the audit was run

- App served by `npm run dev` on `localhost:3000`, driven with Playwright (Chromium) from a scratchpad outside the repo. No app code was changed.
- Viewports: 1440×900 (all screens), 390×844 (chat + sources only), light and dark (explorer + chat only).
- **No `GEMINI_API_KEY` was configured**, so every AI-backed response observed came from the server's offline fallback path. Real Gemini output was **not** observed.
- Not exercised: file upload / drag-and-drop, activation of Focus mode (the "Focus mode" button on the cycle screen — not "Iniciar Concentración", which only starts the timer), timer completion, audio playback, PDF print.
- Screenshots: `redesign/audit/observed/` (numbered by flow).

## 1. URL routes

There is **one** client URL: `/` [OBS: `location.pathname` is `/` on every screen]. No router, no hash, no query params, no `history` use [CODE: no matches]. Back/forward and deep links do nothing. Dev/prod server also serves any path as the SPA (`app.get('*')` in prod; Vite SPA fallback in dev) [CODE].

## 2. Virtual views (state-driven "pages")

All views are conditional renders in `src/App.tsx`.

| # | View | Condition [CODE] | Entry | Exit |
|---|------|------------------|-------|------|
| V1 | **Login** (`LoginScreen`) | `currentUser === null` | App start; "Salir" | "Empezar" |
| V2 | **Explorer** (`NotebooksExplorer`) | `currentView === 'explorer'` | after login; "Mis Carpetas"; delete active notebook; "Salir" (chat header) | open notebook / create notebook |
| V3 | **Workspace** | `currentView === 'workspace'` and an active notebook | click notebook card; create notebook; context menu "Abrir Cuaderno" | "Mis Carpetas" |
| V3a | – Segment **CHAT** | `activeSegment === 'CHAT'` | default on open | tab click |
| V3b | – Segment **FUENTES** | `'FUENTES'` | tab; "3 fuentes" chip; "+ Añadir Fuentes" | tab |
| V3c | – Segment **ARTEFACTOS** | `'ARTEFACTOS'` | tab; CTAs from Sources/Chat | tab |
| V3d | – Segment **ESTUDIO** | `'ESTUDIO'` or Focus mode | tab | tab |

Login always shows first: on mount `App` removes `focused_auth_user` from sessionStorage [CODE]. Data persisted in localStorage is reloaded after login.

### V3d sub-views (`NotebookMethods`, internal tab state `activeMethodTab`)

| Sub-view | Tab label [OBS] | Notes |
|----------|-----------------|-------|
| `progreso` | "Gráfica Semanal" | weekly chart, daily-goal `select` (30/45/60/90 min/día), "+15m", "+25m Pomodoro" |
| `pomodoro` | "Pomodoro (Focus mode)" | config screen (study 20/25/30, long break 15/20/25/30, "Iniciar ciclo pomodoro") → cycle screen ("Iniciar Concentración", reset, test-mode buttons, session log, micro-question) |
| `active_recall` | "Active Recall" | "Generar Desafío de Active Recall" → question + textarea → "Comparar con Respuesta Canónica" / "Cambiar Pregunta" |
| `flashcards` | "Flashcards" | card flip, "Anterior", "Siguiente", "Marcar como Dominada (+15 XP)" |

## 3. Overlays (not routes; render over any view)

| Overlay | Component | Open | Close [OBS] |
|---------|-----------|------|-------------|
| Support agent (floating panel + FAB) | `SupportAgentChatbot` | navbar "Soporte IA"; floating `?` FAB (bottom-right) | "Minimizar"; panel controls |
| Google Search agent | `GoogleSearchAgent` | navbar "Google Search"; "Google" button in chat | explicit close control; **Escape did not close it** |
| Student profile modal | `StudentProfileModal` | bottom-left "PERFIL" bar | "Cerrar modal" / "Entendido"; **Escape did not close it** |
| New folder modal | in `NotebooksExplorer` | "+ Nueva Carpeta" | "Cancelar" / "Crear Carpeta" |
| New notebook modal | in `NotebooksExplorer` | "+ Nuevo Cuaderno"; "Agregar Cuaderno" in a folder; "Crear Primer Cuaderno…" | "Cancelar" / "Crear Cuaderno" |
| Notebook context menu | in `NotebooksExplorer` | right-click on a notebook card (also a "more" button [CODE]) | click away |
| Add-source modal | in `NotebookSources` | "Cargar de Galería / Fotos", "Manual / Enlace" | "Cancelar" / "Guardar Fuente" |
| Source analysis/preview modal | in `NotebookSources` | per-source "Análisis IA" | "Cerrar" |
| Artifact config panel | in `NotebookArtifacts` | type button (Resumen/Quiz/Cards/Guía/Examen/Audio/Infografía/Slides) | "Cancelar" / generate |
| Edit-sources-for-artifact modal | in `NotebookArtifacts` | "Editar fuentes a utilizar" | [CODE] |
| Artifact viewer modal | in `NotebookArtifacts` | "Abrir Documento / PDF"; auto-opens after generation [OBS] | "Cerrar visor" |
| Citation chunk inspector | in `NotebookChat` | click a citation chip [CODE `inspectingChunk`] | [CODE] |
| Focus warning / exit-confirm modals | in `NotebookMethods` | [CODE `isFocusWarningModalOpen`, `isExitConfirmModalOpen`] — **not observed** | — |
| Toasts | `App` | source processing notice (info/success, top-right); focus tamper warning (top-center) | auto [CODE] |

`fixed inset-0` overlay containers per file [CODE]: Artifacts 3, Sources 2, Explorer 2, Methods 2, Chat 1, Search 1, Profile 1 — each hand-written, no shared modal.

## 4. Persistent chrome

| Element | Visible when | Contents [OBS] |
|---------|--------------|----------------|
| Top navbar (`Navbar`) | logged in and not in Focus mode | logo "MIA / Mi Inteligencia Artificial"; (workspace) "Mis Carpetas" + active-notebook pill; "Blanco / Negro" theme switch; "Google Search"; "Soporte IA"; streak chip (6d); minutes chip (55m); username; "Salir" |
| Segment tabs | workspace only | CHAT (count), FUENTES (count), ARTEFACTOS (count), ESTUDIO |
| Notebook banner | workspace, not Focus mode | icon, subject, "Contexto de Estudio Activo", title, "+ Añadir Fuentes", "N fuentes" chip, chat thread chips with "×", "+ Iniciar chat", "Salir" |
| Bottom bar | logged in [CODE `fixed bottom-0`] | "PERFIL / Plan Pro • Estado de Cuenta" button; "Plan Universitario Pro"; streak (6 días); "55m / 60m hoy" |
| Support FAB | logged in | circular `?` bottom-right |

The streak and daily minutes appear in both the navbar and the bottom bar [OBS].

## 5. Server routes (consumed by the UI)

| Endpoint | Used by | Notes |
|----------|---------|-------|
| `POST /api/extract-file-content` | `NotebookSources` | file → text (multimodal / `pdf-parse`) |
| `POST /api/process-and-analyze-source` | `App.handleAddSource` | per-source analysis |
| `POST /api/analyze-sources` | `NotebookSources` ("Re-analizar Fuentes") | notebook-level `SourceAnalysis` |
| `POST /api/generate-artifact` | `NotebookArtifacts` | [OBS] returned an artifact in fallback mode |
| `POST /api/refine-artifact` | `NotebookArtifacts` ("Mejorar") | |
| `POST /api/chat` | `NotebookChat` (2 call sites) | [OBS] returned a cited answer in fallback mode |
| `POST /api/active-recall` | `NotebookMethods` | [OBS] returned a question in fallback mode |
| `POST /api/support-chat` | `SupportAgentChatbot` | returns `reply` + optional `reservation` |
| `POST /api/search-grounding` | `GoogleSearchAgent` | modes `general` / `news` / `factcheck` |

## 6. Observed anomalies tied to pages (facts only)

- Escape does not close Profile modal or Search agent [OBS].
- Mobile 390 px: document width 521 px (horizontal overflow) in chat and sources; segment tab bar clipped ("ART…"); header icons collapse to icons-only [OBS].
- Three different controls are labelled "Salir" in the chat view: navbar logout, banner "Salir" (back to folders), and "Salir del chat" (back to folders) [OBS].
- "+ Iniciar chat" appears twice in the same chat view (banner and chat panel) [OBS].
- Chat answer rendered literal Markdown asterisks (`**condiciones de incertidumbre extrema**`) [OBS, screenshot `10-chat.png`].
- Explorer header shows "Perfil Frecuente (Modelado)" to the end user [OBS].
- `index.html` has `lang="en"`, UI is Spanish [CODE].
