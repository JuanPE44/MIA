# Component Specifications

Status: **proposal, awaiting owner approval**. No code changed. Tokens: `ui-specifications.md` §2–4. Reference patterns: `component-patterns.md`. Current implementations: `audit/components-inventory.md`.

Each component lists: anatomy · variants · sizes · states · behavior/accessibility · responsive · replaces (current code). Measurements in px. "Hit 44" = transparent hit area extended to 44 × 44 on touch.

States vocabulary used everywhere: `default · hover · pressed · focus-visible · selected · disabled · loading · error`.

---

## 1. Actions

### 1.1 Button

- **Anatomy:** [leading icon 20] label [trailing icon 20]; gap 8; padding-x 16 (md), 20 (lg), 12 (sm).
- **Variants:**

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| `primary` | `primary` | `text.on-primary` | — | One per area: Crear, Generar, Empezar sesión |
| `secondary` | `bg.surface` | `text.strong` | 1 `border.control` | Alternatives: Nueva carpeta, Cancelar |
| `ghost` | transparent | `primary.text` | — | Tertiary in toolbars: Copiar, Ver análisis |
| `danger` | `danger` | white | — | Only inside ConfirmDialog |
| `danger-ghost` | transparent | `danger` | — | "Eliminar" in menus/forms |

- **Sizes:** `sm 32` (hit 44, label 14) · `md 40` · `lg 48` (label 16). Radius `md 12`; `primary lg` on Bienvenida and session start uses `pill`.
- **States:** hover = `primary.hover` / `bg.subtle`; pressed = hover + scale 0.98; focus-visible ring; disabled = 40 % opacity, `aria-disabled`, still focusable when it needs an explanation (tooltip/inline reason); loading = spinner replaces leading icon, label kept, `aria-busy`.
- **Responsive:** full-width in phone dialogs/sheets and form footers.
- **Replaces:** gradient buttons and per-component button styles.

### 1.2 IconButton

- 40 × 40 (md) / 32 (sm, hit 44); radius `md`; icon 20. Variants `ghost` (default), `secondary`, `primary` (round, pill, e.g. send).
- Always `aria-label`; tooltip on hover/focus with the same text (desktop).
- Replaces: 2–10 `title`-only icon buttons per screen (UX-17).

### 1.3 Link

`primary.text`, underline on hover and always when inline in body text; visited not styled. Breadcrumb links: `text.muted`, current item `text.strong` with `aria-current="page"`.

### 1.4 Menu (overflow / account)

- Trigger: IconButton "Más opciones" (`MoreVertical`) or Avatar.
- Panel: `bg.surface-raised`, radius `md`, elevation 2, min-width 200, padding 4; items 40 h (44 on touch), icon 20 + label, `danger` items last after a divider.
- Keyboard: Enter/Space/↓ opens, arrows move, Escape closes and returns focus, typeahead.
- Phone: opens as bottom Sheet with the same items.
- Replaces: right-click context menu (UX-19); right-click still opens the same menu on desktop.

---

## 2. Inputs

### 2.1 TextField

- **Anatomy:** label (14/500, above, 8 gap) · field 40 (md) / 48 (lg) · helper or error text (14, 4 gap). Optional leading icon, trailing clear button.
- **Field:** `bg.surface`, 1 `border.control`, radius `md`, padding-x 12, text 16 (prevents iOS zoom).
- **States:** hover border `text.muted`; focus border `primary` + ring; error border `danger` + error text with icon, `aria-invalid`, `aria-describedby`; disabled `bg.subtle`.
- **Validation:** on blur and on submit; messages in Spanish ("Escribe un título para el cuaderno"). Required marked "(obligatorio)" in label text, optional fields marked "(opcional)" — whichever is fewer per form.
- Replaces: browser-native bubbles (UX-14).

### 2.2 Textarea

As TextField; min 3 rows, auto-grow to 8 rows then scroll. Character counter `caption` when a limit exists.

### 2.3 Composer (chat input)

- Auto-grow textarea 1–6 rows inside a container: radius `lg`, 1 `border.control`, padding 8.
- Row: [Textarea] [IconButton send, primary round 40]. Below (or left on desktop): "Fuentes activas: 3 de 3" link, ghost "Buscar en la web".
- Enter sends, Shift+Enter newline; send disabled when empty or while waiting; placeholder "Pregunta sobre tus fuentes…".
- Phone: pinned to bottom above BottomTabBar, respects keyboard (`visualViewport`), safe-area padding.
- Used by Chat, Ayuda, Buscar en la web (one implementation, UX-27).

### 2.4 Select

Native `<select>` styled as TextField with chevron, for short lists (daily goal, folder in forms). For > 7 options or rich items use Menu-based Combobox.

### 2.5 Switch

- Track 40 × 24, thumb 20; off: `border.control` track outline; on: `primary` fill. Label to the left/right, whole row clickable (hit 44).
- `role="switch"`, `aria-checked`.
- Uses: "Usar en el chat" (sources), "Modo blindado", artifact toggles, theme not (uses SegmentedControl).

### 2.6 Checkbox / Radio

20 × 20, radius 6 (checkbox) / full (radio), 1.5 `border.control`; checked `primary` fill + white check. Used in bulk selection (edit sources for a material).

### 2.7 SegmentedControl

- Container `bg.subtle`, radius `pill`, padding 4; segments 32 h (hit 44), label 14/500; selected segment `bg.surface` + elevation 1 + `text.strong`.
- `role="radiogroup"`, arrow keys move.
- Uses: theme (Claro/Oscuro/Sistema), viewer mode (Lectura/Interactivo), web search mode, quality/format/length, study durations.
- Replaces: Profile tabs-as-choices, artifact pickers, search modes.

### 2.8 FileDrop

- Dashed 1.5 `border.control` area, radius `lg`, min-height 160, icon 24 + "Arrastra un archivo o" + Button secondary "Elegir archivo". Accepted types and max size in `small` text.
- Drag-over: `primary.tint` fill + `primary.tint-border`.
- Phone: no drop area text; two buttons "Tomar foto" / "Elegir archivo".
- After selection: file row (icon, name, size, remove) + size warning InlineAlert (warning) if large for local storage.

### 2.9 SearchField

TextField with leading search icon, clear button, `role="search"` wrapper, debounced filtering, result count announced politely.

### 2.10 IconPicker (emoji)

Grid of 12 emoji tiles 44 × 44 (radius `md`), selected = `primary.tint` + border; plus accent color row (6 swatches §2.2 of UI spec) each with a text name for screen readers. `role="radiogroup"`.

---

## 3. Navigation

### 3.1 TopBar

- 56 h, `bg.surface`, bottom 1 `border.hairline`; elevation 1 when content scrolled.
- Left: logo (MIA wordmark, 24 h, links to Mis cuadernos) · desktop/tablet nav links: Mis cuadernos · Progreso · Ayuda (label 14/500, active = `primary.text` + 2 px underline).
- Right: `TodayChip` · Avatar menu.
- Phone: logo · TodayChip · Avatar menu (menu adds Progreso, Ayuda).
- Hidden in Modo blindado.
- Replaces: Navbar (~11 controls, includes segment tabs and theme switch).

### 3.2 TodayChip

Pill 32 h (hit 44), `bg.subtle`; content: clock icon + "55/60 min" · flame icon (`accent.star` icon only) + "6". Links to Progreso. `aria-label="Hoy 55 de 60 minutos, racha de 6 días. Ver progreso"`. Turns `success` icon when goal met.

### 3.3 Breadcrumb

`nav aria-label="Ruta"`; items separated by chevron 16; truncation: middle items collapse to "…" menu when width < content; current item not a link.

### 3.4 NotebookHeader

- Desktop/tablet 64 h: Breadcrumb (row 1, `small`) and `h1` notebook title (row 2, h1 desktop 24/32 here to save space) with notebook icon tile 40; right: sources count chip ("3 fuentes", links to Fuentes) + Button secondary "Añadir fuente" + Menu (Renombrar, Mover a…, Eliminar).
- Phone 56 h: back IconButton (to Mis cuadernos) + title (truncate 1 line) + Menu (includes Añadir fuente).
- Replaces: notebook banner, navbar pill, Estudio subtitle (3 repetitions).

### 3.5 Tabs (navigation)

- 48 h row, tabs label 14/500 + icon 20, padding-x 16, gap 4; bottom 1 `border.hairline`; active: `primary.text` + 2 px `primary` underline + weight 600 (not color alone).
- Optional count badge (`caption`, `bg.subtle`, pill).
- `role="tablist"` only when panels switch in place; for URL sections use `nav` + links with `aria-current`.
- Overflow on narrow widths: horizontal scroll with fade edges; never clipped.
- Uses: notebook sections (tablet/desktop), Estudiar sub-sections (all widths), Cuenta sub-pages.
- Reference: category tabs [EXT].

### 3.6 BottomTabBar (phone)

- 64 h + safe area, `bg.surface`, top 1 `border.hairline`; 4 equal items: icon 24 + label 12/600 (caption; acceptable because icon + label are redundant and label is the accessible name).
- Active: icon filled/`primary.text`, label `primary.text`, 32 × 4 indicator pill above icon.
- Items: Chat (`MessageSquare`), Fuentes (`FileText`), Materiales (`Layers`), Estudiar (`Timer`).
- Hidden while the keyboard is open and in Modo blindado.

### 3.7 Pagination / carousel

Not needed (no carousels). Long lists use plain scrolling; galleries > 24 items show "Ver más".

---

## 4. Containers

### 4.1 Card (base)

`bg.surface`, 1 `border.hairline`, radius `lg 20` [EXT], padding 16 (phone) / 20 (≥ tablet). Interactive card: entire card is one link/button (title is the accessible name), hover elevation 1 + border `border.control`, focus ring around the card, selected `primary.tint` + `primary.tint-border`. Secondary actions sit in a Menu button with its own focus stop (not nested inside the link element).

### 4.2 NotebookCard

- Min width 260, height auto (≈ 168). Anatomy: icon tile 40 (accent bg + emoji) · `h3` title (2 lines max) · subject `small text.muted` · meta row: folder chip, "3 fuentes", "Hoy" · Menu (top-right).
- Grid: `repeat(auto-fill, minmax(260px, 1fr))`, gap 24 (16 phone).
- States: default, hover, focus, dragging (desktop optional: elevation 2, 2 % rotate off if reduced motion), empty-sources hint ("Sin fuentes").
- Replaces: `div` cards (UX-02).

### 4.3 FolderFilter + FolderHeader

- Filter chips row (Chip `selectable`): Todos · folders (emoji + name + count) · Sin carpeta; horizontal scroll on phone.
- When a folder is selected: FolderHeader with optional cover banner (16:5, radius `lg`), `h2` folder name, count, Menu (Renombrar, Cambiar ícono/portada, Eliminar), Button "Nuevo cuaderno aquí".

### 4.4 SourceRow

- 64 min-h list row (not a card; list in a Card container with dividers). Anatomy: type icon 20 in 40 tile · title (`body-strong`, 1 line) + meta `small` (type, size/pages, date) · StatusBadge (Analizando… / Lista / Error) · Switch "Usar en el chat" (label visually "Chat" on phone, full accessible name) · Menu (Ver análisis, Preguntar en el chat, Eliminar).
- Analyzing: spinner in StatusBadge, switch disabled with reason.
- Error: InlineAlert compact under row with "Reintentar".

### 4.5 MaterialCard

- Card 260 min; type icon tile + type label `caption`, `h3` title, meta (date, "3 fuentes"), SimulatedBadge when applicable; actions: primary click opens viewer; Menu (Abrir, Ajustar material, Imprimir / PDF, Eliminar).

### 4.6 TypeTile (create material)

- 2 × 4 grid (desktop), 2 cols (phone). Tile 120 min-h: icon 24, name `body-strong`, one-line description `small`. Disabled (no sources): 40 % opacity + shared InlineAlert above the grid "Añade al menos una fuente para crear materiales [Añadir fuente]".

### 4.7 Panel / Section

Titled group inside a page: `h2` + optional description + optional actions on the right; collapsible variant (`button` header with chevron, `aria-expanded`) used for "Resumen del cuaderno" and "Personalizar". Reference accordion [EXT] (radius 20, `+`/`×` icons replaced by chevron).

### 4.8 Dialog

- Sizes sm 400 / md 560 / lg 800; radius `lg`; elevation 3; scrim `rgb(18 22 28 / 48%)`.
- Header: `h2` title + IconButton close (top-right). Body: padding 24, scrolls. Footer: right-aligned buttons (secondary then primary), sticky.
- Phone: becomes **Sheet**: full-width from bottom, radius `lg` top corners, max-height 92 vh, drag handle 32 × 4; tall forms become full-screen with header back/close.
- Behavior per a11y rules (UI spec §8.4). No dialog opens another dialog except ConfirmDialog.
- Replaces: 11 `fixed inset-0` overlays (UX-05).

### 4.9 FullscreenViewer

For material viewer: full viewport, own toolbar 56 h (back, title, SegmentedControl Lectura/Interactivo, zoom −/+ with %, Copiar, Imprimir / PDF, Ajustar material, Menu). Content max 800 for reading; interactive types own their layout. Addressable URL; Escape and Back close.

### 4.10 Sheet (side panel, desktop)

Right-side panel 400 for Ayuda / Buscar en la web on desktop: non-modal when it does not cover the composer, otherwise modal. Close button + Escape.

---

## 5. Feedback

### 5.1 InlineAlert

- Anatomy: icon 20 · title (`body-strong`, optional) · text · actions (ghost buttons). Radius `md`, padding 12–16, tint background + 1 px border of the semantic color at 30 %.
- Variants: `info` (primary tint), `success`, `warning`, `danger`, `simulated`.
- `role="alert"` for danger created after an action; static ones have no role.

### 5.2 Toast

- Bottom-center (phone, above BottomTabBar) / bottom-left (desktop); `bg.surface-raised` light, `#262D37` dark; radius `md`; elevation 2; max-width 400.
- Content: icon + one line + optional action ("Deshacer", "Ver"). Auto-dismiss 5 s (8 s with action); pauses on hover/focus; `role="status"`.
- One at a time; new replaces old.
- Replaces: two hand-written toasts, `alert()`.

### 5.3 ConfirmDialog

`alertdialog` sm 400: title states the action ("¿Eliminar el cuaderno «Lean Startup»?"), body states consequence ("Se eliminarán 3 fuentes y 5 materiales. No se puede deshacer." or "Puedes deshacerlo durante unos segundos"), buttons Cancelar (secondary, initial focus) + danger "Eliminar". Replaces 6 `window.confirm` sites (UX-24).

### 5.4 EmptyState

Centered, max-width 400: icon 48 in 96 circle (`primary.tint`), `h2` 20, one sentence, **one** primary action, optional secondary link. Bienvenida/explorer empty may use `gradient.panel` background.

### 5.5 Loading

- Spinner 16/20/24, `primary.text`, `role="status"` with hidden label.
- Skeleton blocks `bg.subtle`, radius matching target; used for lists and cards > 300 ms.
- AI "thinking" in chat: three-dot indicator inside an assistant bubble + "Pensando…" for screen readers.
- Long generation (materials): progress text steps ("Leyendo fuentes… Redactando…") — no fake percentages.

### 5.6 StatusBadge

Pill 24 h, `caption` text + icon 14: `neutral` (bg.subtle), `info` (Analizando…, spinner), `success` (Lista), `danger` (Error), `warning`.

### 5.7 SimulatedBadge

Pill 24 h, `simulated.tint` bg, `simulated` text, icon `FlaskConical` 14 + "Simulado"; tooltip/popover text: "Respuesta de ejemplo: la IA todavía no está conectada." Required on every AI output while AI is mocked (decision A2). Never combined with "verificado" styling.

---

## 6. Data display

### 6.1 Chip

- 28 h (sm 24 for display-only), radius `pill`, padding-x 12, label 14/500 (13 min for sm).
- Variants: `display` (bg.subtle, no border), `outline` (1 border.hairline) [EXT], `selectable` (outline → selected `primary.tint` + `primary.tint-border` + `primary.on-tint`, check icon), `removable` (× IconButton sm with hit 44).

### 6.2 Avatar

Circle 32 / 40 / 64; initials on accent tile fallback; image `alt` = name. Used in TopBar (32) and Perfil (64).

### 6.3 StatTile

Card variant: icon 20 in tint circle · value `h1` tabular · label `small` · optional delta/hint `small text.muted`. Grid 2 cols phone, 3–4 desktop.

### 6.4 Chart (weekly progress)

Recharts bar chart, bars radius 6 top, color `primary` (goal met days `success`), goal line dashed `text.muted`, axes `caption`, gridlines `border.hairline`. Accessible: visually hidden table with the same data; values on focus/hover tooltip.

### 6.5 ChatMessage

- User: right-aligned bubble, `primary.tint` bg, `text.strong`, radius `lg` with 4 px bottom-right corner, max-width 80 %.
- Assistant: left, no bubble fill on desktop (full-width reading, max 720), avatar icon 24 MIA; rendered Markdown subset (bold, italic, lists, headings h3–h4 → `body-strong`, inline code, links). Footer row: citations (CitationChip list) · SimulatedBadge (if mock) · feedback IconButtons 👍 👎 (`ThumbsUp/Down` icons) + "Comentar".
- Error variant: InlineAlert danger inside the message slot: "No pude responder. Tu pregunta quedó guardada." + Button sm "Reintentar"; no citations.
- Support/search variants reuse the same component with different footers (reservation request card, "Añadir como fuente").

### 6.6 CitationChip

Chip outline sm with `FileText` 14 + "Fuente 1 · p. 3"; click opens CitationInspector (Dialog md / Sheet) with source title, chunk text with highlighted fragment, "Abrir fuente". Only rendered for service-produced citations.

### 6.7 RequestCard (Ayuda)

Card with `warning`-tinted header "Solicitud enviada · pendiente de confirmación", rows (Tipo, Materia, Fecha y hora, Lugar/Tutor), note "Esto todavía no reserva un lugar real." Copy action. Replaces "registrada en el sistema" card (UX-06).

### 6.8 Timer

`timer` type, tabular; stage label above (`label`, "Estudio · 1 de 4"); circular progress ring 280 (phone 220), stroke 8, track `border.hairline`, progress `primary` (study) / `success` (break). Controls below: Button primary lg Pausar/Reanudar, secondary "Terminar". Announces stage changes via live region.

### 6.9 Flashcard

Card 3:2 (max 560 × 373), radius `lg`, centered text `h2`; face label `caption` ("Pregunta"/"Respuesta"); flip on click/Space/Enter (button role); hint as ghost button revealing InlineAlert info. Controls: Anterior / Siguiente (secondary), "La domino (+15 XP)" (primary), progress "3 de 12".

---

## 7. Component map: current → new

| Current (inventory) | New components |
|---|---|
| `Navbar` | TopBar, TodayChip, Avatar Menu, Tabs (moved to NotebookHeader) |
| Bottom bar in `App` | Removed → TodayChip + Progreso |
| Notebook banner | NotebookHeader, Breadcrumb |
| `NotebooksExplorer` | SearchField, FolderFilter, FolderHeader, NotebookCard, Menu, Dialog (forms), IconPicker, ConfirmDialog, EmptyState |
| `NotebookChat` | ThreadsPanel (list + Menu), ChatMessage, Composer, CitationChip, CitationInspector |
| `NotebookSources` | SourceRow, Switch, Panel (analysis), Dialog (Añadir fuente: SegmentedControl, FileDrop, TextField, Textarea), StatusBadge |
| `NotebookArtifacts` | TypeTile, Sheet (quick create + Personalizar Panel), MaterialCard, FullscreenViewer, SegmentedControl, Switch, Flashcard, quiz/podcast/infographic renderers |
| `NotebookMethods` | Tabs, Timer, Switch (Modo blindado), Flashcard, Composer-like answer field, InlineAlert |
| `WeeklyStudyChart` | Chart, StatTile, Select, Button |
| `SupportAgentChatbot` | ChatMessage, Composer, RequestCard, Sheet / page |
| `GoogleSearchAgent` | Dialog/Sheet, SegmentedControl, ChatMessage, Composer |
| `StudentProfileModal` | Perfil page (TextField, Avatar), Preferencias page (SegmentedControl, ConfirmDialog) |
| `LoginScreen` | Bienvenida (Button lg, SegmentedControl theme compact) |
| 2 toasts, 4 `alert()`, 6 `confirm()` | Toast, InlineAlert, ConfirmDialog |
