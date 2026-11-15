# Product Map

Legend: **[OBS]** observed in browser · **[CODE]** read in source · **[INF]** inferred. AI behavior was observed only in offline-fallback mode (no API key).

## 1. What the product is

Study copilot ("MIA — Mi Inteligencia Artificial", internal name "FocusEd Copilot"). A student organizes **notebooks** (optionally in **folders**), loads **sources**, then talks to an AI grounded on those sources, generates **study artifacts**, and uses **study methods** (Pomodoro/Focus mode, active recall, flashcards, weekly progress). Positioning text in `metadata.json`/`index.html`: turns school texts into active-learning artifacts "inside a distraction-proof environment" [CODE].

## 2. Users and roles

- **No roles, no permissions, no multi-user, no real authentication** [CODE].
- Login screen: greeting "¡Bienvenido de nuevo Juan!" and a single "Empezar" button; it hard-codes `onLoginSuccess('Juan', 'frecuente')` [OBS + CODE].
- Type `UserType = 'frecuente' | 'nuevo'`: `frecuente` loads seed data; `nuevo` starts empty. **`nuevo` is not reachable from the UI** (LoginScreen never passes it); it only works if `sessionStorage.focused_auth_usertype = 'nuevo'` is set manually [CODE].
- One persona exists in the product: the student "Juan" (profile editable: name, degree, university, academic term, avatar seed) [CODE: `StudentProfile`].
- Plan labels "Plan Pro / Plan Universitario Pro" are displayed; no billing, upgrade or plan logic found [CODE: only display strings; **[INF]** static].

## 3. Capability map

| Module | Capabilities | Evidence |
|--------|--------------|----------|
| **Session** | enter app, log out, light/dark theme ("Blanco/Negro"), reset demo data | OBS |
| **Explorer** | list folders + loose notebooks; search by name; create/delete folder (name, icon, optional cover); create notebook (title, subject, folder, description, icon); move notebook into/out of folder (context menu); delete notebook; open notebook | OBS + CODE |
| **Chat** (per notebook) | multiple threads (new, switch, rename, delete); ask questions answered with citations; citation chips open a chunk inspector; per-message feedback (👍 / 👎 / "Mejorar" with comment); "Google" button hands off to Search agent; shows how many sources are ticked for the chat; suggestion to create an artifact | OBS (send, new thread, citations, feedback buttons) + CODE |
| **Sources** (per notebook) | add by file/gallery, web link, pasted text (types text/pdf/link/image/video/audio); drag-and-drop zone [CODE]; AI analysis per source; notebook analysis (topic, subtopics, key concepts, authors, structure, evaluation points); tick/untick sources for chat ("Tildar todas / Destildar todas"); delete source; "Preguntar" about a source (jumps to chat with prompt); CTAs "Crear resumen de texto", "Crear otro artefacto" | OBS + CODE |
| **Artifacts** (per notebook) | 8 types: resumen, cuestionario (Quiz), flashcards (Cards), guía, modelo de examen, audio (podcast), infografía, presentación (Slides); personalization: quality (Bajo/Medio/Alto/Detallista), format (Texto/Punteo/Brainstorming/Jerárquico), length (Conciso/Intermedio/Detallado), toggles (cite sources, keep titles, highlight authors + color, add examples, generate graphics, generate index); choose sources used; viewer with "Vista Hoja PDF" / "Modo Interactivo", zoom, print/PDF, copy text; "Mejorar" (refine with feedback); delete; quiz results; flashcard flip + hint; podcast player state | OBS (config panel, generation, viewer) + CODE (flip, hint, podcast state) |
| **Study (ESTUDIO)** | weekly progress chart + daily goal (30/45/60/90 min) + quick-log "+15m", "+25m Pomodoro"; Pomodoro cycle (4 study sessions, 3 breaks, configurable durations, test-speed mode); **Focus mode**; micro-question during breaks; Active Recall (AI question, written answer, compare with canonical answer); Flashcards deck with mastery (+15 XP) | OBS (all tabs, cycle screen) + CODE (focus mode internals) |
| **Focus mode** ("Modo Blindado") | hides navbar/banner/other segments; requests browser fullscreen and keyboard lock; on tab switch/visibility change shows warning, plays alert sound, increments "tamper attempts blocked" | CODE (`App.tsx` 116–175, `NotebookMethods`) — **not observed end-to-end** |
| **Google Search agent** | grounded web Q&A in 3 modes (Eventos Actuales / Citar Noticias Recientes / Verificar Información); suggested prompts; copy, open source, save result to notebook as a source ("Al Cuaderno") | OBS (open, modes, suggestions) + CODE |
| **Support agent** | chat with canned quick actions (book tutoring, book study room, PDF upload problem, how Focus mode works); produces a reservation card (id, type, subject, date/time, host/room); reset, minimize, copy | OBS (open + chips) + CODE |
| **Profile** | tabs "Plan Actual & Estado de Cuenta" and "Datos Académicos"; edit profile; "Restablecer datos de prueba" | OBS (tabs) + CODE |
| **Gamification / stats** | streak days, XP, focus minutes today, total focus hours, sessions completed, flashcards mastered, tamper attempts blocked, weekly logs | CODE (`UserStudyStats`) + OBS (streak 6d, 55m, "TU RENDIMIENTO HOY" tiles) |

## 4. Entities and relationships (`src/types/index.ts`) [CODE]

```
Folder 1 ──< Notebook (folderId nullable → "cuaderno suelto")
Notebook 1 ──< SourceItem
Notebook 1 ──0..1 SourceAnalysis
Notebook 1 ──< StudyArtifact ── ArtifactPersonalization (embedded)
Notebook 1 ──< ChatThread 1 ──< ChatMessage ──< CitationChunk
                                  └ sourcesCited: string[] (by title, not id)
Notebook also carries legacy chatMessages[] alongside chatThreads[]
StudentProfile (single)      UserStudyStats (single, global) ──< DailyStudyLog
FlashcardItem (used by Study → Flashcards; relation to Flashcards artifact not verified)
```

Facts worth knowing:
- `UserStudyStats` and `StudentProfile` are **global**, not per notebook [CODE].
- Artifact `citations` and message `sourcesCited` reference sources **by title string**, not by id [CODE].
- `Notebook.category` and `color` exist in the model but `handleCreateNotebook` always sets `category:'emprendimiento'`, `color:'indigo'` [CODE].
- Source file bytes can be stored in `SourceItem.fileDataUrl` (base64) and are persisted with notebooks in localStorage [CODE; **[INF]** storage-quota risk, not tested].
- Dates are stored as display strings (`toLocaleDateString('es-ES')`, "Hoy") [CODE].

## 5. Information architecture / navigation

```
Login
 └─ Explorer ─ (search, folders, loose notebooks)
      └─ Workspace (notebook)
           ├─ CHAT ── threads
           ├─ FUENTES ── list, analysis, add
           ├─ ARTEFACTOS ── list, config, viewer
           └─ ESTUDIO ── Gráfica | Pomodoro/Focus | Active Recall | Flashcards
Global overlays: Support agent · Google Search agent · Profile modal
Global chrome: navbar, bottom bar (profile + stats), support FAB
```
Three levels of tabs/segments coexist: global segments (4), study sub-tabs (4), and per-modal tabs (profile 2, add-source 3, search modes 3) [OBS]. See `routes-and-pages.md` for detail.

## 6. Module dependencies (cross-module links) [CODE unless noted]

| From → To | Mechanism |
|-----------|-----------|
| Sources → Chat | `selectedForChat` flag on each source decides what the chat is grounded on; "Preguntar" sets `chatInitialPrompt` and switches to CHAT |
| Sources → Artifacts | `selectedSourceIdsForArtifact` (defaults from sources); "Crear resumen de texto" / "Crear otro artefacto" set `pendingArtifactType` and open ARTEFACTOS |
| Chat → Artifacts / Sources | `suggestArtifactAction` button → `onGoToArtifactsTab`; `onGoToSourcesTab` |
| Chat ↔ Search agent | "Google" button opens agent with query; agent "Al Cuaderno" saves a `SourceItem` into the notebook |
| Notebook content → Study | Active Recall and micro-question use the active notebook as context |
| Study → Stats → Navbar/bottom bar/Profile | `onUpdateStats` from Methods/WeeklyStudyChart updates global stats shown in 3 places |
| Support agent ← App state | receives `currentView`, `activeNotebook`, `activeSegment`, `stats`, `username` as context |
| All AI modules → server | `/api/*` (see `routes-and-pages.md` §5); each endpoint has a heuristic fallback when no key / bad JSON |
| App ↔ browser storage | localStorage: folders, notebooks, stats, profile, theme; sessionStorage: auth markers |

## 7. State inventory per feature

| Feature | States identified | Evidence |
|---------|-------------------|----------|
| Login | idle · loading (250 ms delay) | CODE |
| Explorer | populated · empty folder ("Crear Primer Cuaderno en esta Carpeta") · search-filtered · empty-account (only reachable via `nuevo`) · modal open · context menu open | OBS (populated, empty folder, modals, menu) |
| Source | analyzing (`isAnalyzing`) · processed · unprocessed · selected/unselected for chat · previewing | CODE; OBS (processed, selected) |
| Add source | type chooser (file/link/text) · extracting file · analyzing · dragging | CODE |
| Chat | empty thread · sending/loading · answered with citations · grounding warning · feedback pending/commented · renaming | OBS (answered, new empty thread) + CODE |
| Artifact generation | idle · config open · generating (`isGenerating`) · generated (viewer auto-opens) · refining | OBS (generated) + CODE |
| Artifact viewer | PDF sheet / interactive · zoom · quiz results shown · card flipped / hint · podcast playing | OBS (modes visible) + CODE |
| Pomodoro | config · cycle not started · running · paused · stage complete · break with micro-question (revealed/hidden) · test-speed on | OBS (config, cycle screen) + CODE |
| Focus mode | inactive · active (fullscreen + hidden chrome) · tamper warning · exit-confirm | CODE only |
| Active recall | idle · loading · question shown · answer typed · canonical revealed | OBS (idle→question) + CODE |
| Flashcards | front · flipped · mastered | OBS (front, buttons) + CODE |
| Support agent | open · minimized · loading · reply · reservation card · copied | OBS (open, chips) + CODE |
| Search agent | idle · loading · result · copied · saved-to-notebook | OBS (idle with suggestions) + CODE |
| Profile | tab 1 · tab 2 · saved-success | OBS (tab 1) + CODE |
| Theme | light · dark | OBS |

Error states: server errors surface as HTTP 500 JSON on endpoints [CODE]; **no dedicated error UI was observed or searched for exhaustively** [INF: needs verification before design].

## 8. What was NOT verified

Real AI output quality/format (no API key) · file upload and drag-and-drop · Focus mode activation via the "Focus mode" button (fullscreen, keyboard lock, tamper sound) · timer completion transitions · podcast audio · print/PDF output · `nuevo` user flow · tablet widths · dark mode beyond explorer and chat · prod build (`NODE_ENV=production`).
