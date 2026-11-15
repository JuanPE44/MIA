# Screen by Screen

Status: **proposal, awaiting owner approval**. No code changed. Components: `component-specifications.md`. Foundations: `ui-specifications.md`. Flows: `improved-user-journeys.md`. URLs: `information-architecture.md` §4.

Each screen: **Structure · Layout · Hierarchy · Components · States · Interactions · Responsive · Changes vs current**. Wireframes are schematic (not to scale).

Shared shell for all logged-in screens: TopBar (56). Notebook screens add NotebookHeader + Tabs (desktop/tablet) or NotebookHeader + BottomTabBar (phone). Global rule: every AI output carries SimulatedBadge while AI is mocked.

---

## S1 — Bienvenida (`/`)

**Structure:** centered card on `bg.page` with subtle `gradient.panel` / violet glow behind the card only (reference hero, toned down).

```
┌─────────────────────────────────────────┐
│                         [Tema ◐ ▾]      │
│        ┌───────────────────────┐        │
│        │  MIA (logo)           │        │
│        │  ¡Hola de nuevo, Juan!│ display│
│        │  Tu copiloto de estudio│ body  │
│        │  [   Empezar   ] lg   │        │
│        └───────────────────────┘        │
└─────────────────────────────────────────┘
```

- **Layout:** card max 440, padding 40 (24 phone), vertically centered; theme SegmentedControl compact top-right.
- **Hierarchy:** display greeting → one-line value proposition → one primary button.
- **Components:** Button primary lg pill, SegmentedControl (Claro/Oscuro/Sistema, icons only with labels for SR).
- **States:** returning (Empezar); first visit with no data: two buttons stacked — primary "Empezar desde cero", secondary "Probar con datos de ejemplo"; loading (button spinner, ≤ 250 ms as today).
- **Interactions:** Empezar → continues to the URL that was open (A7) or `/cuadernos`.
- **Responsive:** phone full-bleed card without border; no overflow at 320.
- **Changes:** one theme control instead of "Blanco/Negro"; first-run path reachable; fixes 362 px overflow at 320.

---

## S2 — Mis cuadernos (`/cuadernos`)

```
desktop
┌ TopBar ────────────────────────────────────────────────────────────┐
│ h1 Mis cuadernos                       [Nueva carpeta] [Nuevo cuaderno]
│ 2 carpetas · 4 cuadernos · 9 fuentes                                │
│ [🔍 Buscar cuadernos…                    ]                          │
│ (Todos) (📚 Emprendimiento 3) (🧪 Biología 1) (Sin carpeta 0)       │
│ ┌ FolderHeader (only when a folder is selected) ───────────────┐   │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                        │
│ │NotebookCard x N  (grid auto-fill 260, gap 24)                    │
└─────────────────────────────────────────────────────────────────────┘
```

- **Structure:** page header (h1, totals, actions) → search → folder filter → (folder header) → grid. In "Todos", notebooks are grouped by folder with `h2` group headings, loose ones last under "Sin carpeta".
- **Layout:** container 1240; header actions right-aligned (desktop) / below title (phone).
- **Hierarchy:** h1 → primary "Nuevo cuaderno" → cards; totals and filters secondary.
- **Components:** Button, SearchField, Chip selectable, FolderHeader, NotebookCard, Menu, Dialog (Nuevo cuaderno, Nueva carpeta, Mover a…), IconPicker, ConfirmDialog, Toast (undo), EmptyState.
- **States:**
  - Populated · filtered by folder · search results · search no results ("No hay cuadernos con «x»" + Limpiar búsqueda).
  - Empty folder: EmptyState "Esta carpeta está vacía" + "Crear cuaderno aquí".
  - Empty account: EmptyState "Crea tu primer cuaderno" + secondary "Usar datos de ejemplo".
  - Storage error: InlineAlert warning at top.
- **Interactions:** card click/Enter opens notebook (last section; Fuentes if no sources). Menu: Abrir, Renombrar, Mover a… (Dialog sm with radio list of folders + "Sin carpeta"), Eliminar (ConfirmDialog + Toast "Deshacer"). Right-click opens the same Menu. Desktop drag a card onto a folder chip → move + toast.
- **Dialogs:**
  - *Nuevo cuaderno* (md): Título (obligatorio), Materia, Carpeta (Select, preselected), Descripción (Textarea, opcional), Ícono y color (IconPicker). Footer: Cancelar / Crear cuaderno.
  - *Nueva carpeta* (md): Nombre, Ícono, Portada (opcional: choose from existing images). Footer: Cancelar / Crear carpeta.
- **Responsive:** phone: header actions → primary full-width button + "Nueva carpeta" in page Menu; chips scroll horizontally; 1-column cards; dialogs as sheets. Tablet: 2–3 columns.
- **Changes:** removes "EXPLORADOR DE ESTUDIO · Perfil Frecuente (Modelado)" and right-click instruction; folder banners → filter + header; cards focusable (UX-02); visible menu (UX-19); inline validation (UX-14); app dialogs instead of `confirm()` (UX-24).

---

## S3 — Notebook shell (all `/cuadernos/:id/*`)

```
desktop                                             phone
┌ TopBar ───────────────────────────────────┐     ┌ TopBar ───────────────┐
│ Mis cuadernos › Emprendimiento › Lean St. │     │ ←  Lean Startup    ⋮  │
│ [🚀] h1 Lean Startup   (3 fuentes) [Añadir fuente] ⋮ │                    │
│ [Chat] [Fuentes 3] [Materiales 5] [Estudiar]│    │  content              │
├────────────────────────────────────────────┤     │                       │
│ section content                            │     ├───────────────────────┤
└────────────────────────────────────────────┘     │ Chat Fuentes Mat. Est.│
                                                   └───────────────────────┘
```

- **Hierarchy:** notebook title is the page `h1`; section name is announced by the active tab (each section has a visually hidden `h2` or visible `h2` where useful).
- **States:** not found ("No encontramos este cuaderno" + link Mis cuadernos); Modo blindado hides shell.
- **Interactions:** "Añadir fuente" opens the add-source dialog from any section; Menu: Renombrar, Mover a…, Eliminar.
- **Changes:** replaces navbar segment tabs + banner + "Salir" ×2 + "+ Iniciar chat"; phone tabs no longer clipped (UX-03).

---

## S4 — Chat (`/cuadernos/:id/chat/:threadId?`)

```
desktop ≥1024
┌ ThreadsPanel 280 ─┬ Conversation (max 720 centered) ─────────────┐
│ [+ Nuevo chat]    │  user bubble ──────────────────▶             │
│ • Chat 1      ⋮   │  ◀ MIA answer (markdown)                     │
│ • Repaso cap.2 ⋮  │    [Fuente 1 · p.3] [Fuente 2]  (Simulado)   │
│                   │    👍 👎 Comentar · Crear un material con esto│
│                   │ ┌ Composer ─────────────────────────────┐    │
│                   │ │ Pregunta sobre tus fuentes…       (➤) │    │
│                   │ └ Fuentes activas: 3 de 3 · Buscar en la web┘ │
└───────────────────┴───────────────────────────────────────────────┘
```

- **Structure:** `aside` ThreadsPanel + `main` conversation + Composer (sticky bottom).
- **Hierarchy:** latest exchange → composer → threads (secondary).
- **Components:** ThreadsPanel (Button "Nuevo chat", list items 44 h with title + date, Menu Renombrar/Eliminar), ChatMessage, CitationChip, CitationInspector, SimulatedBadge, Composer, InlineAlert, EmptyState.
- **States:**
  - No sources: EmptyState "Añade fuentes para empezar a preguntar" + "Añadir fuente" (Chat composer disabled with reason).
  - Empty thread: 3 suggested questions as Chips (from notebook analysis) + composer focused.
  - Waiting: assistant placeholder with dots, send disabled, "Detener" not required (no streaming).
  - Answered (simulated badge while mocked).
  - Error: ChatMessage error variant + Reintentar (UX-01).
  - Feedback given: icon filled; "Comentar" opens inline Textarea under the message.
  - Renaming thread: inline TextField in the list item (Enter saves, Escape cancels).
- **Interactions:** Enter sends; citation opens inspector; "Buscar en la web" opens S8 with question; "Crear un material con esto" → Materiales quick-create with type suggestion; deleting the last thread creates a new empty "Chat 1" + toast (UX-30).
- **Responsive:** tablet: ThreadsPanel as overlay drawer from a "Chats" button in a 48 h sub-header; phone: sub-header row ("Chat 1 ▾" opens threads Sheet, "Nuevo chat" IconButton), messages full width, assistant text without bubble, composer pinned above BottomTabBar, no floating buttons (UX-21).
- **Changes:** removes "Protección y Fidelidad… Sin alucinaciones" footer, duplicate "+ Iniciar chat", "Salir del chat"; renders Markdown (UX-16); multiline (UX-27); text ≥ 14 px (UX-04).

---

## S5 — Fuentes (`/cuadernos/:id/fuentes`)

```
┌───────────────────────────────────────────────────────────────┐
│ h2 Fuentes (3)                      [Añadir fuente]           │
│ ▾ Resumen del cuaderno   (Simulado)          [Volver a analizar]
│   Tema · Subtemas · Conceptos · Autores · Estructura · Evaluación
│ Usar en el chat: [Todas] [Ninguna]          3 de 3 activas    │
│ ┌ SourceRow ─────────────────────────────────────────────────┐│
│ │ [PDF] Lean Startup cap.1   PDF · 12 págs · hoy  (Lista) [Chat ●] ⋮│
│ │ [🔗] Artículo HBR          Enlace · ayer         (Analizando…) [ ] ⋮│
│ └────────────────────────────────────────────────────────────┘│
│ Siguiente paso: [Crear resumen] [Crear otro material] [Preguntar en el chat]
└───────────────────────────────────────────────────────────────┘
```

- **Layout:** single column max 960; analysis Panel collapsible (open by default when ≤ 3 sources, collapsed otherwise; remembered).
- **Hierarchy:** list of sources is primary; analysis secondary; next-step CTAs at the end.
- **Components:** Panel (collapsible), SourceRow, Switch, StatusBadge, Menu, Dialog "Añadir fuente", Dialog "Análisis de la fuente", InlineAlert, EmptyState, Buttons.
- **Add source dialog (md / sheet):** SegmentedControl Archivo · Enlace · Texto · Desde la web.
  - Archivo: FileDrop + Título (prefilled from filename).
  - Enlace: URL (validated) + Título (opcional).
  - Texto: Título + Textarea.
  - Desde la web: embeds S8 content; results "Añadir como fuente".
  - Footer: Cancelar / Añadir. After add: dialog closes, row appears "Analizando…", toast "Fuente añadida".
- **States:** empty (EmptyState "Añade tu primera fuente" + button; supported types listed); analyzing; ready; error per row; large-file warning; save failed (InlineAlert danger at top: "No se pudo guardar en este navegador. Libera espacio eliminando fuentes grandes.").
- **Interactions:** Switch toggles grounding immediately (toast not needed; count updates, `aria-live`); "Ver análisis" opens dialog with source analysis + "Preguntar en el chat"; delete → ConfirmDialog.
- **Responsive:** phone: SourceRow stacks title/meta, switch + menu on the right; "Usar en el chat" bulk actions in a Menu; next-step CTAs as full-width stack.
- **Changes:** two add buttons → one (with web search inside); checkboxes → labelled switches; no duplicated empty guidance (UX-25); explicit per-source status and errors (UX-09, UX-13).

---

## S6 — Materiales (`/cuadernos/:id/materiales`)

```
┌───────────────────────────────────────────────────────────────┐
│ h2 Crear material                                             │
│ [Resumen] [Cuestionario] [Tarjetas] [Guía]                    │
│ [Modelo de examen] [Audio] [Infografía] [Presentación]        │
│ h2 Tus materiales (5)                 [Ordenar: Recientes ▾]  │
│ ┌MaterialCard┐ ┌MaterialCard┐ ┌MaterialCard┐ ...              │
└───────────────────────────────────────────────────────────────┘
```

- **Hierarchy:** creation first (primary task), gallery second.
- **Components:** TypeTile, Sheet "Crear <tipo>", Panel collapsible "Personalizar", SegmentedControl, Switch, Checkbox list (sources), MaterialCard, FullscreenViewer, InlineAlert, EmptyState, SimulatedBadge.
- **Quick-create sheet (md dialog / phone sheet):**
  - Title "Crear cuestionario", one-line description.
  - Fuentes: "Usando 3 fuentes activas" + link "Cambiar" (Checkbox list).
  - Extensión: SegmentedControl Conciso / Intermedio / Detallado.
  - ▸ Personalizar (collapsed): *Contenido* (Calidad, Formato), *Estilo* (Mantener títulos, Resaltar autores + color, Agregar ejemplos, Generar gráficos, Generar índice), *Fuentes* (Citar fuentes).
  - Footer: Cancelar / **Generar**. Last-used options remembered per type.
- **States:** no sources (tiles disabled + InlineAlert with "Añadir fuente"); generating (sheet footer button loading + step text; user may close the sheet — card appears in gallery with "Generando…" skeleton); generated (viewer opens); generation error (card error state + Reintentar); empty gallery ("Todavía no creaste materiales").
- **Viewer (S6b, `/materiales/:artifactId`):** FullscreenViewer; SimulatedBadge in toolbar; Lectura (paper-like page, max 800, `bg.surface` on `bg.page`) / Interactivo (quiz with answers + results, flashcards, podcast player, infographic). "Ajustar material" opens Dialog with Textarea "¿Qué quieres cambiar?" → loading → updated with toast "Material actualizado · Deshacer".
- **Responsive:** tiles 4 cols desktop, 2 phone; gallery 1 col phone; viewer toolbar collapses Copiar/Imprimir/Ajustar into Menu on phone; zoom via pinch on phone.
- **Changes:** "Artefactos" → "Materiales"; full Spanish type names (UX-20); 23 options hidden behind Personalizar (UX-26); `alert()` → inline reason (UX-13); "Mejorar" → "Ajustar material".

---

## S7 — Estudiar (`/cuadernos/:id/estudiar/{sesion|repaso|tarjetas}`)

Sub-navigation: Tabs `Sesión · Repaso activo · Tarjetas` (all widths) + right-aligned link "Hoy 55/60 min → Progreso".

### S7a — Sesión: setup

```
┌ Card max 560 ───────────────────────────────┐
│ h2 Sesión de estudio                        │
│ Estudio  (20) (25●) (30) min                │
│ Descanso largo (15) (20●) (25) (30) min     │
│ Ciclos: 4 · Descanso corto: 5 min           │
│ ┌ Modo blindado ───────────────── [● on] ┐  │
│ │ Pantalla completa y aviso si cambias   │  │
│ │ de pestaña.  ¿Cómo funciona?            │  │
│ └─────────────────────────────────────────┘  │
│ [        Empezar sesión        ] lg pill    │
└─────────────────────────────────────────────┘
```

### S7b — Sesión: running

```
┌──────────────────────────────────────────────┐
│ (🛡 Modo blindado: activado)   [Salir del modo]│
│          Estudio · 1 de 4                    │
│              ( 24:13 )  ring                 │
│        [ Pausar ]  [ Terminar ]              │
│ Registro: ■ □ □ □  (estudio/descanso)        │
│ Descanso → Micro-pregunta (Simulado) [Ver respuesta]
└──────────────────────────────────────────────┘
```

- **Components:** SegmentedControl, Switch, Button lg, Timer, StatusBadge, InlineAlert, Dialog (leave warning, end confirm), Toast.
- **States:** setup; running study; paused; break (micro-question card); stage complete (alarm + toast "¡Bloque completo!"); session finished (summary card: minutos, bloques, salidas de la pestaña + "Ver progreso" / "Otra sesión"); blindado on/off; tab left (warning Dialog `alertdialog`: "Saliste de la pestaña" + sound + counter); fullscreen unsupported (InlineAlert info: "Tu navegador no permite pantalla completa; igual te avisaremos si cambias de pestaña"); attempting to reload/close during session → browser `beforeunload` confirmation.
- **Modo blindado layout:** whole viewport, `bg.page`, only S7b content; TopBar/NotebookHeader/BottomTabBar hidden; "Salir del modo" always visible (keyboard reachable; Escape exits fullscreen as the browser does, never blocked).
- **Responsive:** phone: Timer 220 ring, controls full-width; setup segmented controls wrap; summary as sheet.
- **Changes:** "Iniciar ciclo pomodoro" + "Iniciar Concentración" + separate "Focus mode" → one "Empezar sesión" with switch (UX-07); explicit indicator; no Tab/Escape lock (UX-23); test-speed controls removed from UI (dev flag) (UX-15); "bloqueos tab" → "salidas de la pestaña" explained; stats tiles moved to Progreso (UX-12).

### S7c — Repaso activo

Card max 720: "Generar pregunta" (primary) → question (`h2`, SimulatedBadge) → Textarea "Tu respuesta" → "Comparar con la respuesta" → two-column compare (stacked on phone): "Tu respuesta" / "Respuesta de referencia" → "Otra pregunta". States: idle, loading, question, compared, error (Reintentar), no sources (inline reason).

### S7d — Tarjetas

Flashcard centered, progress "3 de 12", controls (Anterior, Siguiente, Pista, "La domino (+15 XP)"). States: front, back, hint shown, mastered (check badge + toast "+15 XP"), deck finished (summary + "Repasar no dominadas"), empty deck ("Crea un material de Tarjetas" → Materiales).

---

## S8 — Buscar en la web (dialog/sheet from Fuentes or Chat)

- **Structure:** Dialog lg (desktop) / full-screen sheet (phone): title "Buscar en la web", SegmentedControl Actualidad · Noticias con citas · Verificar un dato, suggested prompts (Chips), results stream (ChatMessage search variant), Composer.
- **Result footer:** links to sources (Link list), Copiar, **Añadir como fuente** (primary sm) → toast "Añadida a Fuentes".
- **States:** idle with suggestions, loading, result (SimulatedBadge), error (Reintentar), service unavailable (InlineAlert).
- **Changes:** no longer a global overlay; Escape closes (UX-05); status dot removed (UX-29).

---

## S9 — Progreso (`/progreso`)

```
┌───────────────────────────────────────────────────────────────┐
│ h1 Tu progreso                                                │
│ ┌ Hoy ────────────────────────────┐  Meta diaria [60 min ▾]   │
│ │ 55 / 60 min  ███████████░  ring │  [+15 min] [+25 min]      │
│ └─────────────────────────────────┘                           │
│ [Racha 6 días] [XP 340] [Horas totales 18] [Sesiones 11]      │
│ [Tarjetas dominadas 24] [Salidas de pestaña 3 ⓘ]              │
│ h2 Esta semana   (bar chart + hidden table)                   │
└───────────────────────────────────────────────────────────────┘
```

- **Components:** StatTile, Chart, Select, Button secondary (manual log, each with toast + undo), InlineAlert info explaining "salidas de pestaña".
- **States:** goal met (success accents), no activity yet (EmptyState "Empieza una sesión para ver tu progreso" → last notebook Estudiar), manual log added.
- **Responsive:** tiles 2 cols phone, 3 tablet, 6 wide; chart full width, horizontal scroll disabled (7 bars fit).
- **Changes:** consolidates navbar chips, bottom bar, Estudio tiles, profile stats (UX-11, UX-12).

---

## S10 — Ayuda (`/ayuda`; desktop side panel when opened from a notebook)

- **Structure:** h1 Ayuda · assistant conversation (ChatMessage + Composer) with quick-action Chips (Pedir tutoría, Pedir sala de estudio, Problema con un PDF, ¿Qué es el modo blindado?) · "Mis solicitudes" list (RequestCard, session only) · short FAQ (collapsible Panels).
- **States:** empty conversation (chips), loading, reply (SimulatedBadge), request created (RequestCard warning header), error (Reintentar), reset ("Nueva conversación").
- **Responsive:** phone full page; desktop page two columns (conversation 2/3, solicitudes + FAQ 1/3); side-panel variant 400 from notebook screens (does not cover Composer).
- **Changes:** FAB removed from workspace (UX-21); "registrada" → "Solicitud enviada · pendiente de confirmación" (UX-06); proper dialog/page semantics (UX-05).

---

## S11 — Cuenta: Perfil (`/cuenta/perfil`) and Preferencias (`/cuenta/preferencias`)

- **Structure:** h1 Cuenta + Tabs Perfil · Preferencias; content max 640.
- **Perfil:** Avatar 64 + "Cambiar avatar" (seed regenerate) · TextFields: Nombre, Carrera, Universidad, Período académico · Footer: Guardar (disabled until changed) → inline success "Cambios guardados".
- **Preferencias:** Tema (SegmentedControl Claro/Oscuro/Sistema) · Datos: text "Tus datos se guardan solo en este navegador." · Button danger-ghost "Restablecer datos de ejemplo" → ConfirmDialog.
- **Hidden:** plan labels and "Estado de cuenta" (owner decision).
- **States:** pristine, dirty, saving, saved, validation error.
- **Responsive:** single column; tabs full-width on phone.
- **Changes:** modal → pages with URLs; Escape issue disappears (UX-05); demo reset separated (UX-15); plan hidden (UX-28).

---

## S12 — Account menu (overlay from Avatar)

Items: name + career (non-interactive header) · Perfil · Preferencias · Tema ▸ (Claro/Oscuro/Sistema inline radio) · (phone only) Progreso, Ayuda · divider · Cerrar sesión. Phone: bottom Sheet.
**Changes:** "Salir" → "Cerrar sesión" in one place (UX-10).

---

## S13 — Global states

| State | Presentation |
|---|---|
| Route not found | EmptyState "Esta página no existe" + "Ir a Mis cuadernos" |
| Storage write failed | InlineAlert danger at the top of the current screen, persistent until dismissed; Toast not used |
| Storage near limit | InlineAlert warning in Fuentes when adding files |
| Offline (browser) | Toast info "Sin conexión. Las funciones de IA no están disponibles." (AI calls show error variant) |
| AI mocked | SimulatedBadge on every AI output; Preferencias → Datos explains it |
| Unsaved running session on leave | Browser confirmation (beforeunload) |

---

## Cross-screen consistency checklist

- One `h1` per screen; notebook screens use the notebook title.
- One primary button per area (header or card).
- Destructive actions only in Menus or ConfirmDialog, never as the only visible button of a card.
- All AI surfaces use ChatMessage/Composer and SimulatedBadge.
- Every list has empty, loading and error states defined above.
- Every screen verified at 320, 390, 768, 1024, 1440 and in light/dark before sign-off.
