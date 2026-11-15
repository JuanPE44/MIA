# Information Architecture (Proposed)

Status: **proposal, not approved**. No code or UI changed. Inputs: `audit/product-map.md`, `audit/routes-and-pages.md`, `audit/user-journeys.md`, `audit/ux-audit.md`, `audit/ux-issues.md`. Visual tokens: `design/design-tokens.md`. Companion docs: `ux-proposal.md`, `improved-user-journeys.md`.

UI labels below are Spanish (product language). Labels marked † depend on the glossary validation of UX-20.

## 1. Working assumptions (open owner decisions)

The proposal needs a position on each open decision. Each assumption is the recommended default; the alternative shows what changes if the owner decides otherwise.

| # | Decision (`decisions.md`) | Assumed | If decided otherwise |
|---|---|---|---|
| A1 | Mobile primary? | **Decided: yes**, mobile is first-class (UX-03 treated as P0) | — |
| A2 | Demo or product? | **Decided: real product, built on mocks for now.** All AI output is simulated until the API key is resolved; no database yet; auth may become real earlier. Simulated AI output must be labelled as such ("Respuesta simulada") | — |
| A3 | What survives reload? | **Decided: keep it simple.** Data persists in localStorage (as today); position, session, chat drafts and running timer are **not** restored after reload | — |
| A4 | Accessibility a requirement? | **Decided: WCAG 2.2 AA target** | — |
| A5 | Real reservations? | **Decided: no.** Presented as "solicitud" (request), not "reserva confirmada" | — |
| A6 | Chat failure behavior | **Decided: fail explicitly with retry; offline/simulated answers only when clearly labelled** | — |
| A7 | Router? | **Decided: yes**, addressable locations (URLs, §4). After a reload the user sees Bienvenida (A3); "Empezar" then continues to the URL that was open (no other state restored). Hosting decided: **Vercel** (needs SPA rewrite to `index.html`; Express API will need adapting to Vercel functions) | No router: single URL as today; Back button leaves the app |

## 2. Content model (unchanged entities, clarified scope)

Entities do not change (`src/types/index.ts`). What changes is **where each one is shown and at which scope**.

| Entity | Scope | Lives in (proposed) |
|---|---|---|
| Folder | Account | Mis cuadernos |
| Notebook | Account (in 0..1 folder) | Mis cuadernos → Notebook |
| Source, SourceAnalysis | Notebook | Notebook → Fuentes |
| ChatThread, ChatMessage, Citation | Notebook | Notebook → Chat |
| StudyArtifact | Notebook | Notebook → Materiales† |
| Pomodoro session, Active Recall, Flashcards | Notebook (context) | Notebook → Estudiar |
| UserStudyStats, DailyStudyLog, daily goal | **Account** (global in code) | **Progreso** (new account-level page) |
| StudentProfile, plan, theme | Account | Cuenta (Perfil, Preferencias) |
| Web search result | Transient → becomes a Source | Fuentes → "Buscar en la web"; Chat action |
| Support conversation, reservation request | Transient | Ayuda |

Key correction: weekly progress and stats are **global** but today sit inside a notebook's ESTUDIO tab and in three chrome locations (UX-12). They move to one account-level place.

## 3. Sitemap

```
Bienvenida (Login)
│
└─ App
   ├─ Mis cuadernos                         (home)
   │   ├─ Todos · Carpeta X · Sin carpeta    (filter / sections)
   │   └─ Cuaderno
   │       ├─ Chat           (threads list + conversation)
   │       ├─ Fuentes        (list, notebook analysis, add source, web search)
   │       ├─ Materiales†    (gallery, create, viewer)
   │       └─ Estudiar       (Sesión · Repaso activo† · Tarjetas)
   │
   ├─ Progreso               (weekly chart, daily goal, streak, XP, totals, manual log)
   ├─ Ayuda                  (support assistant, FAQ, Focus mode explainer, solicitudes)
   └─ Cuenta (menu)
       ├─ Perfil             (academic data, avatar)
       ├─ Preferencias       (tema claro/oscuro/sistema, datos de ejemplo, reset)
       └─ Cerrar sesión
```

Overlays that remain overlays (dialogs/sheets): create/edit folder, create/edit notebook, move notebook, add source, source analysis, artifact customization, artifact viewer (full-screen), citation inspector, confirmations.

Overlays that become places: Profile modal → Cuenta/Perfil; Google Search agent → Fuentes "Buscar en la web" (+ chat action); Support floating panel → Ayuda (with a compact launcher, see §5).

## 4. Addressable locations (A7)

| Location | Proposed URL | Restores |
|---|---|---|
| Bienvenida | `/` (redirects to `/cuadernos` if session exists) | — |
| Mis cuadernos | `/cuadernos` · `?carpeta=<id>` · `?q=<search>` | filter, search |
| Notebook section | `/cuadernos/<id>/chat` · `/fuentes` · `/materiales` · `/estudiar` | section |
| Chat thread | `/cuadernos/<id>/chat/<threadId>` | thread |
| Artifact viewer | `/cuadernos/<id>/materiales/<artifactId>` | open artifact |
| Study sub-section | `/cuadernos/<id>/estudiar/sesion` · `/repaso` · `/tarjetas` | sub-tab |
| Progreso | `/progreso` | — |
| Ayuda | `/ayuda` | — |
| Perfil / Preferencias | `/cuenta/perfil` · `/cuenta/preferencias` | — |

Rules: Back/Forward step between these locations; dialogs do not create history entries except the full-screen artifact viewer. Unknown id → "Cuaderno no encontrado" with a link to Mis cuadernos. The prod server already serves any path as the SPA (`routes-and-pages.md` §1), so the API contract is unaffected.

## 5. Navigation model

### 5.1 Levels (from 3 tab systems + 11-control header to 3 clear levels)

| Level | Purpose | Control | Desktop ≥ 1024 | Tablet 640–1023 | Phone < 640 |
|---|---|---|---|---|---|
| L1 Global | Where in the app | Mis cuadernos · Progreso · Ayuda · Cuenta | Top bar (left: logo + links; right: today chip + account) | Top bar, links collapse into icons + labels | Top bar: logo, today chip, account menu. Global links inside account menu |
| L2 Notebook | Which section | Chat · Fuentes · Materiales† · Estudiar | Tab bar under notebook header | Tab bar | **Bottom tab bar** (4 items, icon + label) |
| L3 Within section | Sub-view | Threads; Sesión/Repaso/Tarjetas | Side panel / segmented control | Same | Sheet (threads) / segmented control |

Breadcrumb in notebook header: `Mis cuadernos › <Carpeta> › <Cuaderno>`. It replaces the navbar pill, the banner and the Estudio subtitle (3 repetitions today).

### 5.2 Persistent chrome budget

| Element | Today | Proposed |
|---|---|---|
| Top navbar | ~118 px with tabs, ~11 controls | 56 px, ≤ 5 controls |
| Notebook banner | Full banner with chips, "+ Iniciar chat", "Salir" | Compact header 56–64 px: breadcrumb, title, sources count, "Añadir fuente" |
| Bottom bar (profile + stats) | 79–90 px fixed | **Removed** (content moved to Progreso + account menu) |
| Support FAB | Over chat input on phones | Removed from workspace; "Ayuda" in L1. On phones, launcher only on Mis cuadernos, never over inputs |
| Focus mode | Hides chrome | Unchanged intent; shows only timer, exit, end session |

Target: chrome ≤ 12 % of a 900 px desktop viewport (vs ~22 %), ≤ 120 px total on phones including bottom tabs.

### 5.3 Action naming (UX-10, UX-20)

| Action | Today | Proposed |
|---|---|---|
| Sign out | "Salir" (navbar) | **Cerrar sesión** (account menu only) |
| Back to folders | "Salir" (banner), "Salir del chat" | **Breadcrumb "Mis cuadernos"** (no "Salir") |
| New chat | "+ Iniciar chat" ×2 | **Nuevo chat** (once, in threads panel) |
| Theme | "Blanco / Negro" | **Tema: Claro / Oscuro / Sistema** (Preferencias + account menu) |
| Timer start | "Iniciar ciclo pomodoro" → "Iniciar Concentración" | **Empezar sesión** (one step, Focus toggle shown before start) |
| Focus mode | "Focus mode" | **Modo blindado†** (with explanation) |
| Feedback on message | "Mejorar" | **Comentar respuesta** |
| Improve artifact | "Mejorar" | **Ajustar material†** |
| Web search | "Google Search" | **Buscar en la web** |
| Support | "Soporte IA" | **Ayuda** |

### 5.4 Ask surfaces (UX-22)

One rule per question type, stated in the UI:

| Question about… | Surface | Entry |
|---|---|---|
| My material | Notebook **Chat** (grounded on selected sources) | Default section of a notebook |
| The web / current facts | **Buscar en la web** (results can be added as sources) | Fuentes → "Añadir fuente" → "Desde la web"; Chat → "Buscar en la web" with the same question |
| Using MIA, tutoring, rooms | **Ayuda** | L1 global link |

The three keep their own back-ends (`/api/chat`, `/api/search-grounding`, `/api/support-chat`); only entry points and framing change.

## 6. Explorer (Mis cuadernos) structure

- Header: `h1` "Mis cuadernos", search, primary "Nuevo cuaderno", secondary "Nueva carpeta".
- Filter row: chips `Todos · <Carpeta…> · Sin carpeta` (replaces folder banners as navigation; folders still exist as sections in "Todos").
- Content: notebook cards in a responsive grid (`component-patterns.md` §3.1). Each card is one link (UX-02) plus a visible "Más opciones" button (Abrir, Renombrar, Mover a…, Eliminar).
- Totals line ("2 carpetas · 1 cuaderno · 3 fuentes") kept as secondary text.
- Empty account: single empty state with "Crear tu primer cuaderno" and "Usar datos de ejemplo" (A2).

## 7. Labels and glossary (UX-20)

Proposed Spanish-first glossary, to validate with a card sort (UX-20 validation):

| Concept | Proposed label | Kept as secondary |
|---|---|---|
| Artifacts (section) | Materiales† | — |
| Quiz / Cards / Slides | Cuestionario / Tarjetas / Presentación | "Quiz" in helper text if users prefer it |
| Active Recall | Repaso activo† | "(Active Recall)" in tooltip/help |
| Pomodoro | Sesión de estudio | "Pomodoro" as the method name in settings |
| Focus mode | Modo blindado† | — |
| Google Search | Buscar en la web | "con Google" as attribution |

## 8. What stays exactly as is

Folder → Notebook containment; per-notebook sources/chats/artifacts; the 8 artifact types and all their options; all server endpoints and contracts; offline fallbacks on the server (A6 changes only how the client presents failures); localStorage persistence keys (any shape change bumps `_vN`).
