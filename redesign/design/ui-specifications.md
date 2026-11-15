# UI Specifications

Role: Senior UI Designer / Design Systems Architect. Status: **proposal, awaiting owner approval**. No code changed.

Inputs: `reference-analysis.md`, `design-tokens.md` (approved), `component-patterns.md`, `ux-proposal.md` + `information-architecture.md` + `improved-user-journeys.md` (approved), `audit/components-inventory.md`, `decisions.md`.
Companions: `component-specifications.md` (shared components), `screen-by-screen.md` (screens).

Tags: **[EXT]** from reference · **[TOK]** approved token · **[NEW]** defined here (not in reference). Contrast ratios are calculated (WCAG relative luminance) and must be re-checked in the built UI.

> **2026-11-15 — direction updated to "Tinta y resaltador"** (see `design-tokens.md` §11 and `decisions.md` §D-2026-11-15). Where this file mentions `#0066FF`, Plus Jakarta Sans, lucide, radius 8/12/20 or 720-only widths, the values in §12 below win.

## 1. Visual direction

Adapt the reference's **calm, airy, cool-neutral language with one saturated blue** to a study workspace:

| Keep from reference | Adapt for MIA | Drop |
|---|---|---|
| White cards with hairline borders, radius 20 | Denser spacing inside the workspace (reading and lists) | Hero glows behind content, floating marketing cards |
| Single accent `#0066FF` for the one action per area | Blue also marks selection and focus; never decorative | Photo-heavy cards, logo wall |
| Pale-blue selected state | Darker border and text for contrast (AA) | 12–13 px grey meta text |
| Pill chips | Pills for chips, tabs, primary CTA only; inputs at radius 12 | Fully pill inputs |
| Violet gradient | Only in empty states / Bienvenida, and as the "Simulado" hue | Gradient behind reading text |

Personality: **focused, friendly, trustworthy**. Trust is visual: grounded content (citations) looks different from simulated content (violet "Simulado" badge) and from failures (red inline alert).

## 2. Color system

### 2.1 Semantic tokens (light / dark)

All pairs below are text-on-surface unless noted.

| Token | Light | Dark | Use | Contrast L / D |
|---|---|---|---|---|
| `bg.page` | `#FAFAFA` [EXT] | `#12161C` | App background | — |
| `bg.surface` | `#FFFFFF` [EXT] | `#1E242C` | Cards, bars, dialogs | — |
| `bg.surface-raised` | `#FFFFFF` + shadow | `#262D37` | Menus, popovers, dialogs in dark | — |
| `bg.subtle` | `#F4F5F7` | `#262D37` | Input fill (disabled), table header, skeleton | — |
| `text.strong` | `#1E242C` [EXT] | `#E8ECF2` | Headings, body | 15.6 / 13.2 |
| `text.default` | `#323C4B` [EXT] | `#E8ECF2` | Long body text | 11.2 / 13.2 |
| `text.muted` | `#5B6677` | `#A9B3C2` | Meta, helper text | 5.8 / 7.4 |
| `text.on-primary` | `#FFFFFF` | `#FFFFFF` | Text on primary fill | 4.83 |
| `border.hairline` | `#EDEEF0` [EXT] | `#2B3441` | Card edges, dividers (decorative) | 1.2 / 1.4 |
| `border.control` | `#8A93A1` | `#6B7788` | Inputs, switches, checkboxes (≥ 3:1) | ≈ 3 / 3.4 |
| `primary` | `#0066FF` [EXT] | `#0066FF` | Fills (buttons, active tab bar) | white 4.83 |
| `primary.hover` | `#0050CC` | `#3385FF` | Hover/pressed fill | white 6.96 / — |
| `primary.text` | `#0066FF` | `#5C9BFF` | Links, active tab label | 4.83 / 5.7 |
| `primary.tint` | `#E6F0FF` [EXT] | `#14284D` | Selected fill | — |
| `primary.on-tint` | `#0050CC` | `#E8ECF2` | Text on tint | 6.1 / 12.3 |
| `primary.tint-border` | `#3385FF` | `#5C9BFF` | Selected border | ≥ 3 |
| `focus` | `#0066FF` | `#5C9BFF` | Focus ring | — |
| `danger` | `#B42318` [NEW] | `#F97066` | Destructive, errors | 6.6 / 5.6 |
| `danger.tint` | `#FEF3F2` | `#3A1F1F` | Error alert background | text 6.1 / 5.4 |
| `success` | `#067647` [NEW] | `#47CD89` | Saved, done, "Lista" | 5.7 / 7.7 |
| `success.tint` | `#ECFDF3` | `#16301F` | Success alert | 5.4 / — |
| `warning` | `#93370D` [NEW] | `#FDB022` | Storage warnings, leave-session | 7.2 on tint / 8.5 |
| `warning.tint` | `#FFFAEB` | `#33280F` | Warning alert | — |
| `simulated` | `#5B21B6` [NEW] | `#C4B5FD` | "Simulado" badge text/icon | 8.2 on tint / 8.1 on tint |
| `simulated.tint` | `#F5F3FF` | `#2A2340` | "Simulado" badge background | — |
| `accent.star` | `#FFC805` [EXT] | `#FFC805` | Streak flame / XP icon only (never text) | decorative |

Rules:
- Never use color as the only signal: every status pairs color with icon + text.
- `border.hairline` is decorative only; any control boundary uses `border.control`.
- Dark mode has no pure black/white; elevation is a lighter surface + 1 px border, not shadow.

### 2.2 Notebook / folder accent colors [NEW]

Notebooks today store `color` (always `indigo`) and an emoji icon. Proposal: a small set of pastel tile backgrounds (from reference tiles) used **only** behind the notebook icon, never behind text.

| Name | Light | Dark |
|---|---|---|
| Azul | `#E1E9FE` [EXT] | `#1C2A4A` |
| Durazno | `#FFEED2` [EXT] | `#3A2C18` |
| Lima | `#ECF5D6` [EXT] | `#24311A` |
| Rosa | `#FFE4F1` (from `#FFC1DF`) | `#3A1E2E` |
| Violeta | `#EDE9FE` | `#2A2340` |
| Gris | `#F4F5F7` | `#262D37` |

## 3. Typography

Family: **Plus Jakarta Sans** (400/500/600/700), self-hosted; fallback `system-ui, -apple-system, "Segoe UI", sans-serif`. Tabular numerals (`font-variant-numeric: tabular-nums`) for timer, stats and counts.

| Style | Size / line | Weight | Letter-spacing | Use |
|---|---|---|---|---|
| `display` | 40 / 48 (phone 32 / 40) | 600 | −0.02 em | Bienvenida title, session timer label |
| `timer` | 72 / 80 (phone 56 / 64) | 600 tabular | −0.02 em | Pomodoro timer only |
| `h1` | 28 / 36 (phone 24 / 32) | 600 | −0.01 em | One per screen |
| `h2` | 20 / 28 | 600 | 0 | Section titles, dialog titles |
| `h3` | 17 / 24 | 600 | 0 | Card titles, panel titles |
| `body` | 16 / 24 | 400 | 0 | Default text, chat messages |
| `body-strong` | 16 / 24 | 600 | 0 | Emphasis, list labels |
| `label` | 14 / 20 | 500 | 0 | Buttons, tabs, form labels |
| `small` | 14 / 20 | 400 | 0 | Meta, helper text (minimum for informational text) |
| `caption` | 12 / 16 | 500 | 0.01 em | Non-essential only: badge text, chart axes, counters duplicated elsewhere |

Rules: max line length 70 ch for reading (chat, viewer); sentence case everywhere (no ALL CAPS labels except `caption` badges, max 2 words); Spanish labels need ≈ +20 % width — never fixed-width buttons.

## 4. Spacing, sizing, radius, elevation

| Scale | Values |
|---|---|
| Spacing (4 base) | `1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 8=32 · 10=40 · 12=48 · 16=64 · 24=96` |
| Control heights | `sm 32` (visual, with 44 hit area) · `md 40` · `lg 48` |
| Touch target | ≥ 44 × 44 on touch; ≥ 24 × 24 pointer minimum; ≥ 8 px between a destructive and another action |
| Icon sizes | 16 (inline), 20 (default), 24 (nav, empty states 48) — `lucide-react`, stroke 1.75 |
| Radius | `sm 8` (chips small, inputs inside tables) · `md 12` (inputs, buttons, menu items) · `lg 20` (cards, dialogs, sheets top) · `pill 9999` (chips, tabs, primary CTA, badges) |
| Elevation | `0` border only (cards at rest) · `1` `0 2px 8px rgb(30 36 44 / 6%)` (hover cards, sticky bars on scroll) · `2` `0 8px 24px rgb(30 36 44 / 10%)` (menus, popovers) · `3` `0 16px 48px rgb(30 36 44 / 16%)` (dialogs). Dark: replace with `bg.surface-raised` + `border.hairline` |

Shadow offsets/blur derived from reference filters (`0 16 σ20`, `8 8 σ28`); alpha estimated.

## 5. Layout system

### 5.1 Breakpoints

| Name | Range | Columns | Gutter | Side padding |
|---|---|---|---|---|
| `phone` | < 640 | 4 | 16 | 16 |
| `tablet` | 640–1023 | 8 | 24 | 24 |
| `desktop` | 1024–1279 | 12 | 24 | 32 |
| `wide` | ≥ 1280 | 12 | 24 | 40, content max 1240 [EXT] |

No horizontal page scroll at any width ≥ 320. Usable at 200 % zoom (reflows to phone layout).

### 5.2 App shell

```
desktop / tablet                                   phone
┌──────────────────────────────────────────┐      ┌──────────────────────┐
│ TopBar 56                                │      │ TopBar 56            │
├──────────────────────────────────────────┤      ├──────────────────────┤
│ (notebook) NotebookHeader 64 + Tabs 48   │      │ NotebookHeader 56    │
├──────────────────────────────────────────┤      ├──────────────────────┤
│                                          │      │                      │
│ Content (max 1240, or full for Chat)     │      │ Content              │
│                                          │      │                      │
│                                          │      ├──────────────────────┤
│                                          │      │ BottomTabBar 64 + safe│
└──────────────────────────────────────────┘      └──────────────────────┘
```

Chrome budget: desktop 56 (global) + 112 (notebook) = 168 px ≈ 18.7 % of 900 px; collapses to 56 + 48 (header shrinks to tabs-only row) = 104 px (11.6 %) after scrolling 64 px in long views. Phone: 56 + 56 + 64 = 176 px max; NotebookHeader hides on scroll down, returns on scroll up.

Removed from today's chrome: fixed bottom stats bar (79–90 px), notebook banner, support FAB inside the workspace.

### 5.3 Content widths

| Content | Width |
|---|---|
| Reading (chat thread, viewer text, forms) | max 720 |
| Grids (notebooks, materials) | container (1240) |
| Dialogs | sm 400 · md 560 · lg 800 · full on phone |
| Side panel (threads, Ayuda desktop) | 280 (threads) · 400 (Ayuda) |

## 6. Iconography and imagery

- One icon set: `lucide-react`, outline, 1.75 stroke, `currentColor`.
- Emojis remain only as **user-chosen notebook/folder icons** (existing feature) shown in a 40 px tile with the accent background; never as UI labels (today: 🔥, ⏱️, 📅 in labels → replaced by icons + text).
- Folder covers (existing feature) shown as 16:5 banner in the folder filter header only; text never placed over images.
- Illustrations: none required; empty states use a 48 px icon in a 96 px tinted circle.

## 7. Motion

| Interaction | Duration | Easing |
|---|---|---|
| Hover/press color | 120 ms | ease-out |
| Menu / popover | 150 ms fade + 4 px translate | ease-out |
| Dialog / sheet | 200 ms (sheet slides up on phone) | `cubic-bezier(0.2, 0, 0, 1)` |
| Toast in/out | 200 / 150 ms | ease-out / ease-in |
| Flashcard flip | 300 ms | ease-in-out |
| Skeleton shimmer | 1.2 s loop | linear |

`prefers-reduced-motion: reduce` → all transitions become instant opacity changes; no flip animation (swap faces), no shimmer.

## 8. Accessibility rules (WCAG 2.2 AA, decided)

1. `lang="es"`; one `h1` per screen; landmarks `header`, `nav` (TopBar, NotebookTabs, BottomTabBar), `main`, `aside` (threads panel).
2. Every control has a visible label or `aria-label`; no `title`-only naming.
3. Focus ring: 2 px `focus` + 2 px offset (outer), visible on all interactive elements, never removed.
4. Dialogs: `role="dialog"`/`alertdialog`, `aria-modal`, labelled by title, Escape closes, focus trapped and returned to trigger.
5. Live regions: chat answers (`aria-live="polite"`), toasts (`status`), errors (`alert`), timer announces stage changes only (not every second).
6. Targets per §4; drag-and-drop always has a button alternative.
7. Text contrast ≥ 4.5:1 (≥ 3:1 for ≥ 24 px or 19 px bold); UI boundaries and focus ≥ 3:1.
8. Modo blindado never traps Tab/Escape; exit control always visible and reachable.
9. Content reflows at 320 CSS px and 200 % zoom; text spacing overrides do not clip.

## 9. Theming

- One mechanism: CSS custom properties for every semantic token, switched by `data-theme="light|dark"` on `<html>`; default follows `prefers-color-scheme` ("Sistema"). Replaces today's mix of `isDarkMode` ternaries and `dark:` variants.
- Persisted in `mia_theme_mode` (existing key; values extend to `light | dark | system`).
- Charts (`recharts`) read the same tokens.

## 10. Content and microcopy

- Spanish, neutral register, sentence case, approved glossary (Materiales, Repaso activo, Modo blindado, Buscar en la web, Ayuda, Cerrar sesión).
- Buttons are verbs: "Crear cuaderno", "Añadir fuente", "Generar", "Empezar sesión".
- Errors say what happened + what to do: "No pude responder. Tu pregunta quedó guardada. [Reintentar]".
- Simulated AI: badge "Simulado" + tooltip "Respuesta de ejemplo: la IA todavía no está conectada".
- Numbers: "55 / 60 min", "6 días de racha", dates relative ("hoy", "ayer", "12 nov.").

## 11. Consistency rules (eliminating current inconsistencies)

| Current inconsistency (audit) | Rule |
|---|---|
| 11 hand-written overlays | One `Dialog` / `Sheet` component |
| 3 chat bubble implementations | One `ChatMessage` + `Composer` shared by Chat, Ayuda, Buscar en la web |
| 5 feedback mechanisms | `InlineAlert`, `Toast`, `ConfirmDialog`, field error — only these |
| 7 different tab/segmented controls | `Tabs` (navigation) vs `SegmentedControl` (choice), nothing else |
| Theme switch duplicated | `ThemeSelect` in Preferencias + account menu |
| Stats in 4 places | `TodayChip` (TopBar) + `StatTile` (Progreso) only |
| Palette: slate/indigo/emerald/amber/purple/rose/sky ad-hoc | Only semantic tokens §2 |
| Gradient buttons, mixed sizes | `Button` variants and 3 sizes |

## 12. "Tinta y resaltador" overrides (2026-11-15)

- **Typography**: display Fraunces (`h1`, `h2`, `font-display`), UI Hanken Grotesk, data JetBrains Mono (`font-mono`: timer, stats, citation numbers, metadata). Display weights 500. Replaces §3 family line.
- **Palette**: light and dark values in `design-tokens.md` §11.2–11.3. One accent only: highlighter (`bg-highlight` + `text-highlight-ink`), never as text color. Primary = ink blue; in dark, `on-primary` is dark ink.
- **Radius**: `small 6 · control 10 · card 14 · pill`. Widths: `narrow 560 · reading 720 · wide 960 · content 1240`.
- **Shape language**: ink-outline secondary buttons, rule borders, hard 2 px offset shadow on hover/selected, small translate (-1 px, -1 px). Tabs/BottomTabBar: animated highlighter bar. Toast: sticky note, -1 deg, spring entry.
- **Motion**: see `design-tokens.md` §11.6; components `Highlight`, `Reveal`/`RevealItem`, `CitationChip` in `src/ui`.
- **Iconography** (replaces §6): one set, Phosphor via `src/ui/Icon` (`<Icon name="…" />`, semantic keys in `src/ui/Icon/icons.ts`; screens never import the library). Weights: `regular` default, `duotone` for empty states, tiles and notebook/folder identity, `fill` for the active nav item. Sizes via `size-4|5|6|8` (`1em` default). Decorative by default (`aria-hidden`); pass `label` for an accessible name. **No emoji as icons**: notebook/folder icons store a registry key; legacy emoji are mapped at read time with `resolveItemIcon()` (no data migration, no `_vN` bump). `IconPicker` offers a curated set of 24 keys.
- **Shell**: lg+ persistent left rail (brand, Biblioteca / Progreso / Ayuda, recent notebooks, today chip, account menu); < lg slim TopBar; phone keeps BottomTabBar inside notebooks. Notebook header = editorial masthead (Fraunces title, mono metadata, ink rule).
- **Texture**: paper dots + grain on page background only; off in high-contrast / forced-colors.

## 13. QA round 1 corrections (2026-11-15)

- **Page / PageHeader** (`src/ui/Page`): `Page` is the single container of every shell screen (`w-full max-w-content`, left-aligned, never `mx-auto`). `PageHeader({title, meta?, actions?, headingRef?})` = Fraunces h1 (`text-display`), mono meta line, actions slot aligned with the title. `NotebookLayout` wraps header, tabs and section in one `Page`, so notebook titles align with Biblioteca. Welcome has no shell and is exempt.
- **Gutter rule**: only `<main>` in `App.tsx` sets the horizontal gutter, `px-4 sm:px-6 lg:px-12`, and it is not centered. Screens never add their own horizontal margin or `max-w-*` on their root. `max-w-reading` / `max-w-narrow` only wrap inner text blocks or forms, left-aligned. Left edge must be identical at 1440 and 2560 px.
- **AppMark** (`src/ui/AppMark`, `public/favicon.svg`): simplified flower, six stroked petals in ink blue (`currentColor`, default `text-primary`) around a hexagon filled with the highlighter. Props `size` (default 24, crisp at 16) and `label` (omit = decorative). Used next to "MIA" (Fraunces, no highlight) in SideRail and TopBar. `favicon.svg` hardcodes `#2340D8`, `#E8FF5A`, `#1B1A17`; `favicon.jpeg` is kept but unused.
- **Library toolbar**: one row under the header: search (`flex-1 max-w-narrow`, label `sr-only`), "Nueva carpeta" (ghost) and "Nuevo cuaderno" (primary) at the right. Phone: full-width primary + "Más acciones" menu in the header.
- **Folder hierarchy**: folders never look like notebooks. `FolderFilter` has a mono overline "CARPETAS"; chips always use `folder` (`folder-open` + fill when selected), a tile-color dot, and a mono count; "Todas" shows an explicit count ("1 cuaderno"); selected = ink border + highlighter bg. Group headers (and `FolderHeader`) are folder dividers: mono overline "Carpeta", `folder-open` icon, Fraunces name, `border-rule` line. `NotebookCard` takes `showFolder` and hides its folder chip inside a folder group.
- **TodayChip**: mono overline "HOY", `min / goal min` in mono, thin ink progress bar (highlighter fill when the goal is met), "Racha · N días" with ink `streak` icon. No success/star colors. `compact` = single line for TopBar. Links to Progreso with an aria-label.

## 14. QA round 2: noise reduction rules (2026-11-15)

Entering a notebook was judged tiring: too many loud elements and a flat text hierarchy. System rules (apply to every screen):

- **Offset shadow**: `shadow-offset` appears only on hover/focus of clickable cards (`InteractiveCard`, `SourceRow`, `CitationChip`, flashcard) and on transient overlays (Toast). Never at rest and never as a "selected" marker. Resting containers use `border-rule` 1 px; selected = `border-ink` + tint.
- **Buttons**: secondary = 1 px `border-control` (ink on hover), no offset. One solid primary per screen; everything else secondary or ghost. Ghost text is `text-default` (not blue) with the highlighter sweep on hover.
- **Blue** (`primary`) only on primary buttons and inline text links. Selected threads / nav / chips use ink border + `bg-subtle`, never blue text.
- **Highlighter** only for: active tab indicator, `CitationChip`, one keyword per page title (+ Toast). Selected chips and flipped flashcards use `bg-subtle`.
- **Text hierarchy**: body `text-default`, metadata `text-muted`, `text-strong` only for headings/titles and emphasis.
- **Dialog**: `border-rule` + elevation 3, no offset.
- **SimulatedBadge**: neutral, muted, 20 px, no violet fill (`InlineAlert` simulated keeps its tint).
- **Notebook header**: one compact band (breadcrumb, small icon + h1 28 px + inline mono meta, ⋮ menu) and tabs with a single 1 px rule. "Añadir fuente" lives in the ⋮ menu and in Fuentes, not in the header.
- **Chat**: history behind a "Historial" ghost toggle (side panel on lg, dialog below); "Nuevo chat" is ghost; thread dates via `Intl` es-AR ("Hoy 11:22", "Ayer", "3 oct"); assistant turns start with a mono "MIA" label (AppMark 16); user turns use `bg-subtle` without border; sources per message = muted count + numbered `CitationChip`s (full titles in tooltip, inspector and margin notes); raw "[Fuente: …]" lines are stripped at render time; feedback and Simulado show on hover/focus-within (always on touch); composer = 1 px border + focus ring; empty/starter threads show three `InteractiveCard` actions (preguntar, generar material, estudiar 25 min).
