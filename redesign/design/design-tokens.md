# Design Tokens

Source: `redesign/reference/Website.svg` / `.png`. Tags: **[EXT]** exact from SVG · **[EST]** visual estimate · **[PROP]** proposed for MIA. Token names are proposals; nothing here has been applied to code.

> **2026-11-15 — superseded in part by §11 "Tinta y resaltador".** Palette, typefaces, radii, widths, motion and iconography below (§1.2, §3, §5, §10.1, §10.2) are replaced by §11. Token NAMES (`--mia-*`, Tailwind utilities) are unchanged; only values changed and new tokens were added. Source of truth in code: `src/styles/tokens.css`.

## 1. Color

### 1.1 Extracted [EXT]

| Token (proposed) | Hex | Reference use |
|---|---|---|
| `color.text.strong` | `#1E242C` | Headings, dark card |
| `color.text.body-strong` | `#272F3A` | Strong body |
| `color.text.body` | `#323C4B` / `#414D60` | Body |
| `color.text.secondary` | `#475569` | Secondary |
| `color.text.muted` | `#6C7787` | Muted, meta |
| `color.text.subtle` | `#848D9B` | Placeholder-grade (fails AA) |
| `color.primary` | `#0066FF` | Buttons, links, active |
| `color.primary.hover-ish` | `#3385FF` | Lighter blue |
| `color.primary.tint` | `#E6F0FF` | Selected fill |
| `color.primary.border` | `#8AB9FF` | Selected border |
| `color.navy` | `#002B6B` | Numerals, icons |
| `color.border` | `#EDEEF0` | Card hairline |
| `color.border.alt` | `#E6E9EA` | FAQ hairline |
| `color.surface` | `#FFFFFF` | Card / page |
| `color.surface.alt` | `#FAFAFA` | Alternate section |
| `color.accent.violet` | `#391DE8` | Gradient glow only |
| `color.accent.star` | `#FFC805` | Rating |
| `color.success` | `#65C18C` | Online dot |
| `color.tile.peach` / `lime` / `periwinkle` / `pink` | `#FFEED2` / `#ECF5D6` / `#E1E9FE` / `#FFC1DF` | Pastel tiles, avatar backdrops |

### 1.2 Proposed for MIA [PROP]

Keep the reference's cool neutral + single-blue character, fix the failures found in `reference-analysis.md` §3.4.

| Token | Value | Why |
|---|---|---|
| `color.text.muted` | `#5B6677` (≈ 5.7:1 on white, ≈ 5.4 on `#FAFAFA`) | `#6C7787` is 4.35 on `#FAFAFA` |
| `color.border.strong` | `#C6CAD1` (in reference, ≈ 1.7:1) | Decorative dividers only; not enough for control boundaries |
| `color.border.input` | `#8A93A1` (≈ 3:1) | Input/checkbox boundary ≥ 3:1 (WCAG 1.4.11) |
| `color.primary.tint-border` | `#3385FF` instead of `#8AB9FF` | `#8AB9FF` is 2:1 |
| `color.primary.on-tint` | `#0050CC` text on `#E6F0FF` | `#0066FF` on tint is 4.21 |
| `color.focus-ring` | `#0066FF` 2 px + 2 px offset | No focus state in reference; UX-02/05 |
| `color.danger` | **undecided** | Not in the reference |
| `color.warning` | **undecided** | Not in the reference |

Dark theme: **not derivable**. Only dark value in the reference is `#1E242C` (testimonial card). Proposal: use it as `surface` for dark and derive the rest after owner answers decision #8.

Contrast values above are calculated; the `#5B6677`, `#8A93A1`, `#0050CC` figures should be re-verified when finalized.

## 2. Gradients and glows

| Token | Value | Tag |
|---|---|---|
| `gradient.hero-glow` | blurred ellipses fill `white → #391DE8`, σ 62–178 | [EXT] |
| `gradient.panel` | `#FCFDFF → #F0F5FF` | [EXT] |
| `gradient.scrim` | `#002B6B` 0 → 100 % on image bottoms | [EXT] |
| Use in MIA | Optional, only for empty states / onboarding; never behind reading text | [PROP] |

## 3. Typography

All **[EST]** (text is outlined in the SVG). Measured from the PNG: heading line pitch 66 px; body line pitch 24 px; FAQ question line pitch 29 px.

| Token | Size / line-height | Weight | Reference use |
|---|---|---|---|
| `type.display` | 56 / 66 | 500 | Section headings (H2) |
| `type.h3` | 24 / 29 | 500 | Step titles, FAQ questions |
| `type.h4` | 20 / 24 | 600 | Card names |
| `type.body-lg` | 18 / 28 | 400 | Hero sub-copy |
| `type.body` | 16 / 24 | 400 | Sub-lines, FAQ answers |
| `type.small` | 14 / 20 | 500 | Tabs, buttons |
| `type.caption` | 12–13 / 16 | 400–500 | Chips, role, rating |
| `type.numeral` | ≈ 100 / 1 | 300 | `01–03` step numerals, color ≈ `#DDE2EA` |

Families: not extractable. Look-alike candidates: headings Sora / Plus Jakarta Sans-like; body Manrope. Confirm with the designer before choosing.

**[PROP] for MIA**: heading scale ≈ 32/40 (H1), 24/32, 20/28; body 16/24; minimum text **14 px** (no 12–13 px for content); line length ≤ 70 ch; Spanish needs room (labels ≈ +20 %). Uses `type.display` 56 only on landing/onboarding, not inside the workspace.

## 4. Spacing

Extracted gaps [EXT]: 24 (card grid), 30 (FAQ grid), 100 (page gutter), 1240 (container). Observed block spacing [EST]: 8 / 12 / 16 / 24 / 32 / 48 / 64 / 100.

**[PROP] scale (4 px base)**: `0 4 8 12 16 24 32 48 64 96`. Mapping: 24 = card gap, 32 = card padding in dense views / 24 in compact, 96 ≈ section padding (landing only). Container: 1240 max, side padding 16 (mobile) / 24 (tablet) / 100 (≥ 1440 only if a landing exists).

## 5. Radius

| Token | px | Tag | Use |
|---|---|---|---|
| `radius.chip` | 12.5 (pill, h = 25) | [EXT] | Chips |
| `radius.control` | 24–28 (pill) | [EXT] | Buttons, search field |
| `radius.card` | 19.5–20 | [EXT] | Cards, FAQ, images |
| `radius.avatar` | 32 / 30 / 28 (circle) | [EXT] | Avatars, logos |
| `radius.badge` | 19.5 (pill, h = 39) | [EXT] | Hero badge |

**[PROP]**: `sm 8 · md 12 · lg 20 · pill 9999`. Inputs and secondary buttons at `md` (12) instead of fully pill to hold more text/Spanish labels; reserve pill for chips, tabs, primary CTA.

## 6. Borders and elevation

| Token | Value | Tag |
|---|---|---|
| `border.hairline` | 1 px `#EDEEF0` | [EXT] |
| `border.selected` | 1 px `#8AB9FF` + fill `#E6F0FF` | [EXT] |
| `border.icon` | 1.5 / 2 px stroke | [EXT] |
| `shadow.sm` | 8 8 · σ 28 (≈ 0 8 24 / 6 % ink) | offset [EXT], alpha [EST] |
| `shadow.md` | 0 16 · σ 20 | offset [EXT], alpha [EST] |
| `shadow.lg` | 0 35 · σ 22.5 (logos) / 10 25 · σ 50 (floating cards) | offset [EXT], alpha [EST] |

**[PROP]**: at rest = border only (0 shadow). Hover/selected = `shadow.sm`. Overlays/menus = `shadow.lg` reduced. Avoid shadows with x-offset in a dense UI.

## 7. Sizing

| Token | Value | Tag |
|---|---|---|
| `size.control.lg` | 55–56 h | [EXT] |
| `size.control.md` | 48 h | [EXT] |
| `size.chip` | 25 h | [EXT] |
| `size.avatar.md` / `lg` | 56 / 64 | [EXT] |
| `size.icon-button` | 40 | [EXT] |
| `size.icon` | 20–24 | [EST] |

**[PROP]**: min touch target **44 × 44** (chips become 32 h visually with a 44 hit area); reference's 25 px chips are **non-interactive only**.

## 8. Motion

Not present in a static export. **[PROP]**: 150 ms ease-out for hover/focus, 200 ms for accordion, respect `prefers-reduced-motion`; no motion in Focus Shield beyond what exists.

## 9. Breakpoints

Single frame (1440) only. **[PROP]**: `sm 640 · md 768 · lg 1024 · xl 1280`. Driven by UX-03 (overflow from 768 down), not by the reference.

## 10. Owner decisions applied (2026-11-05)

- Visual system approved as analyzed. No further Figma screens exist: tables, dialogs, states and mobile remain **[PROP]**.
- Themes: **light + dark** both required.
- Font: owner delegated the choice.

### 10.1 Typeface [PROP, decided]

**Plus Jakarta Sans** (single family, weights 400 / 500 / 600 / 700). Why: close to the reference's geometric look, free (OFL, Google Fonts), variable, full Spanish diacritics, readable at 14–16 px. Fallback stack: `system-ui, -apple-system, 'Segoe UI', sans-serif`. Replaces the "candidates" note in §3. Self-host to avoid a third-party request (the app has an offline pattern).

### 10.2 Dark theme [PROP]

Derived from the one dark value in the reference (`#1E242C`). Contrast calculated against the stated surface.

| Token | Light | Dark | Dark contrast |
|---|---|---|---|
| `surface.page` | `#FAFAFA` | `#12161C` | — |
| `surface.card` | `#FFFFFF` | `#1E242C` | — |
| `text.strong` | `#1E242C` | `#E8ECF2` | 13.2 on card |
| `text.muted` | `#5B6677` | `#A9B3C2` | 7.4 on card |
| `border.hairline` | `#EDEEF0` | `#2B3441` | decorative (1.4) |
| `border.input` | `#8A93A1` | `#6B7788` | 3.4 on card |
| `primary` (fills) | `#0066FF` | `#0066FF` (white text 4.83) | ok |
| `primary.text/link` | `#0066FF` | `#5C9BFF` | 5.7 on card |
| `primary.tint` | `#E6F0FF` | `#14284D` | text `#5C9BFF` 5.3 |
| `primary.on-tint` | `#0050CC` | `#E8ECF2` | 12.3 |
| `focus-ring` | `#0066FF` | `#5C9BFF` | 5.7 |

Rules: no pure black/white surfaces in dark; shadows replaced by 1 px border + slightly lighter surface for elevation; tinted pastel tiles (§1.1) need dark variants, to be defined when needed. Existing MIA theming uses two approaches under the hood (UX audit): the redesign should unify on CSS variables keyed by `data-theme`/class. Theme choice persists in `mia_theme_mode`.

## 11. Direction "Tinta y resaltador" (2026-11-15, supersedes §1.2, §3, §5, §10.1, §10.2)

Editorial notebook: warm paper, blue ink, ONE fluorescent highlighter accent. The highlighter is only ever a **background behind dark text** (`bg-highlight text-highlight-ink`), never a text color.

### 11.1 Typefaces (self-hosted, `@fontsource-variable/*`)

| Role | Family | Token / utility | Notes |
|---|---|---|---|
| Display | Fraunces (variable; axes wght, opsz, SOFT) | `--mia-font-display` / `font-display` | `h1`/`h2` get it by default (base.css); `font-variation-settings: "opsz" 96, "SOFT" 50`; weights 400–500 |
| UI / body | Hanken Grotesk | `--mia-font-sans` / `font-sans` (default) | 400–700 |
| Data / mono | JetBrains Mono | `--mia-font-mono` / `font-mono` | timer, stats, citation numbers, metadata labels; tabular |

### 11.2 Color — light "papel"

| Token | Value | Notes |
|---|---|---|
| `bg-page` | `#F6F1E7` | paper texture lives here only |
| `bg-surface` / `surface-raised` | `#FFFDF8` | |
| `bg-subtle` | `#EFE8DA` | |
| `text-strong` / `ink` | `#1B1A17` | 15.5 on page |
| `text-default` | `#2E2B26` | 12.5 |
| `text-muted` | `#6B655A` | 5.1 on page, 4.7 on subtle |
| `border-hairline` / `rule` | `#E4DCCB` | decorative |
| `border-control` | `#9A917F` | 3.1 on surface (non-text) |
| `primary` (ink blue) | `#2340D8` | white text 7.5; as text on page 6.7 |
| `primary-hover` | `#1A30A8` | |
| `primary-tint` / `on-tint` | `#E7EAFB` / `#1A30A8` | 8.6 |
| `highlight` / `highlight-ink` | `#E8FF5A` / `#1B1A17` | 15.7 |
| `danger` / tint | `#BC3B26` / `#FBE9E4` | 4.9 on page, 4.7 on tint (spec asked `#C8402A`, darkened for AA) |
| `success` / tint | `#2B7549` / `#E4F2E8` | 5.0 / 4.9 (darkened from `#2F7D4F` for AA) |
| `warning` / tint | `#8A4B0B` / `#FBF0D5` | 6.0 |
| `simulated` / tint | `#5B21B6` / `#F1ECFA` | 7.8 |
| tiles (azul, durazno, lima, rosa, violeta, gris) | `#DDE3F5 #F6E5C8 #E6EDC9 #F3DDD7 #E5DDF1 #EAE3D5` | paper-tinted; never behind small text |

### 11.3 Color — dark "escritorio de noche"

| Token | Value | Contrast |
|---|---|---|
| `bg-page` / surface / raised=subtle | `#14130F` / `#1D1B17` / `#25231E` | |
| `text-strong` / default / muted | `#EDE6D6` / `#DDD6C6` / `#A39B8A` | 15.0 / 11.9 / 6.2 on surface |
| `hairline` / `rule` | `#2E2B25` | decorative |
| `border-control` | `#7A7262` | 3.6 on surface |
| `primary` / hover | `#8EA2FF` / `#A9B8FF` | **dark** `text-on-primary #14130F` on it: 7.8 / 9.7 |
| `primary-tint` / `on-tint` | `#1F2442` / `#C9D2FF` | 10.2 |
| `highlight` / `highlight-ink` | `#D9F24A` / `#14130F` | 14.8 |
| `danger` / tint | `#FF8A73` / `#3A1E19` | 6.6 |
| `success` / tint | `#6FCF97` / `#1A2E22` | 7.6 |
| `warning` / tint | `#E8B04A` / `#33280F` | 7.4 |
| `ink` | `#EDE6D6` | |

### 11.4 Radius, elevation, widths

- Radius: `small 6` · `control 10` · `card 14` · `pill 9999` (`rounded-small|control|card|pill`).
- Hard offset shadow: `--mia-shadow-offset` / `shadow-offset` = `2px 2px 0 var(--mia-offset-color)`; offset color = `ink` (light) and `#5A5446` (dark). Used on hover/selected cards, secondary button hover, toast, dialog, citation chips. Soft `shadow-elevation-*` remain (ring-only in dark).
- Widths: `max-w-narrow` 560 · `max-w-reading` 720 · `max-w-wide` 960 · `max-w-content` 1240 (dialogs unchanged).

### 11.5 Texture

Page background only: 24 px dot grid at ≤4 % alpha (`--mia-paper-dot`) plus an SVG `feTurbulence` grain data URI (≈5 % alpha). Removed under `prefers-contrast: more` and `forced-colors: active`.

### 11.6 Motion

Hover/press 120 ms; dialog 200 ms; highlighter sweep 450–550 ms (`--mia-duration-sweep`, `--mia-ease-out: cubic-bezier(0.16,1,0.3,1)`). The `motion` package drives tab indicator (`layoutId`), toast entry (spring), `Highlight`, `Reveal` (stagger 60 ms). Every motion path checks `useReducedMotion()`; `base.css` keeps the global reduced-motion rule.
