# Reference Analysis

Role: Senior UI Designer / Design Systems Specialist. Input: `redesign/reference/Website.svg` (38 MB, 1440×7645) and `redesign/reference/Website.png` (1440×7645). No frontend code was changed.

Evidence tags used in all three documents:

- **[EXT]** extracted directly from the SVG (exact value).
- **[EST]** estimated visually from the PNG (approximate).
- **[PROP]** proposed design decision for MIA (not in the reference).

## 1. What the reference actually is

A **single-frame marketing landing page** ("Masters Hub", a talent / job-board site) at desktop width 1440. Not an application UI. Consequences for MIA:

| Reference has | Reference does NOT have |
|---|---|
| Hero with search, talent cards, tabs (filter), step cards, logo wall, testimonial, FAQ accordion, CTA, footer | Data tables, forms beyond one search/email field, sidebar or app navigation, dialogs/modals, toasts, empty/loading/error states |
| One breakpoint (1440) | Any other breakpoint — **responsive behavior cannot be extracted, only proposed** |
| Light theme | Dark theme (one dark testimonial card only), focus rings, hover/pressed/disabled states |

Anything MIA needs beyond the left column is **[PROP]**, not derived.

## 2. SVG findings

### 2.1 Structure [EXT]

- Root `<svg>` 1440×7645, white background. Sections are stacked full-width rects with alternating fill `white` / `#FAFAFA`:

| Section | y | height | background |
|---|---|---|---|
| Hero (nav, badge, headline, search, photo strip) | 0 | 920 (strip band 768–920 is `#FAFAFA`) | white + violet blur |
| Discover Masters (tabs + 4×2 cards) | 920 | 1098 | `#FAFAFA` |
| Why Choose (floating cards around photo) | 2018 | ~1061 | white |
| Clients (logo wall) | 3079 | 674 | `#FAFAFA` |
| How It Works | 3753 | 666 | white |
| Portfolio showcase | 4419 | 886 | white |
| Testimonials | 5305 | 783 | `#FAFAFA` |
| FAQ + CTA | 6088 | 656 | white |
| Footer | 6940 | 705 | `#FAFAFA` |

- All content lives in a **1240 px container**: x = 100 → 1340 (100 px side margins). [EXT]
- 29 raster images embedded as base64 PNG (photos, avatars, logos, portfolio). No `<text>` nodes: **all text is converted to outlines**, so there is no `font-family`, `font-size` or `font-weight` to extract. Typography is therefore **[EST] only**.
- Grouping is by `clip-path` per section (`clip0…clipN`); no named groups, no component instances. Repeated elements are visible only as repeated rect sizes (below).
- Shadows are SVG filters (`feGaussianBlur` + `feOffset` + color matrix). Alpha in the color matrix is truncated in the export, so shadow **color/opacity is [EST]**.

### 2.2 Repeated shapes (component fingerprints) [EXT]

| Size (w×h) | rx | Count | Component |
|---|---|---|---|
| 291×241 (+0.5 stroke → 292×242) | 19.5 | ~16 | Talent card (8 visible + states) |
| 604×105 (+stroke → 605×106) | 19.5 | 8 | FAQ item |
| 60×60 | 30 | 10 | Logo circle |
| 64×64 / 56×56 | 32 / 28 | 8 | Avatar circle, `#EDEEF0` placeholder fill |
| 84×25, 53×25, 81×25, 44×25, 57×25, 78×25, 73×25 | 12.5 | ~20 | Skill chip (h = 25, full pill) |
| 150×55 | 27.5 | 1 | Primary search button, fill `#0066FF` |
| 499×56 | 28 | 1 | Search field (white, pill) |
| 187×48 / 144×48 | 24 | 2+2 | Outline pill buttons ("Register Now" / "View All") |
| 318×39 | 19.5 | 1 | Hero badge pill ("Your #1 Platform…") |
| 260×228, 260×92, 260×93 | 20 | 5 | Floating info cards (Why Choose) |
| 461×603 | 20 | 3 | Portfolio image card |
| 287/288×338 | 20 | 8 | Footer/portfolio-adjacent color tiles (`#ECF5D6`, `#FFEED2`, `#E1E9FE`) |
| 40×40 | 20 | 1 | Round arrow button |

### 2.3 Colors, frequency-ranked [EXT]

| Hex | Uses | Role (inferred from placement) |
|---|---|---|
| `#FFFFFF` | 115 | Surface |
| `#1E242C` | 33 | Heading text, dark testimonial card |
| `#002B6B` | 27 fill, 22 stroke | Navy: icons, numerals (`01`–`05`), decorative lines |
| `#414D60` | 26 | Body text |
| `#323C4B` | 22 | Body text (darker variant) |
| `#0066FF` | 21 fill, 6 stroke | Primary action, links, active tab |
| `#272F3A` | 12 | Strong body text |
| `#EDEEF0` | 11 fill, 34 stroke | Hairline border, avatar placeholder |
| `#FFC805` | 8 | Rating star |
| `#475569` | 8 | Secondary text |
| `#6C7787` | 7 | Muted text / icons |
| `#FAFAFA` | 6 | Alternate section background |
| `#3B1FE7`, `#5B40FF`, `#5329D7`, `#391DE8` (gradient) | few | Violet: hero/CTA glow, logo tints |
| `#FFC1DF`, `#FFEED2`, `#ECF5D6`, `#E1E9FE`, `#F3F0D1` | few | Pastel avatar/tile backgrounds |
| `#65C18C`, `#00DD5C`, `#23D05F` | 4+4+1 | "Online" dot / brand-logo green |
| `#848D9B`, `#C6CAD1` | 3, 1 | Lighter muted text / icon |
| `#E6F0FF`, `#3385FF`, `#8AB9FF`, `#B0D0FF` | 2, 2, 7 stroke, 1 | Primary tint (selected card fill), hover-ish blue, selected border |
| `#E6E9EA`, `#EDEDED` | 4, 3 | FAQ / misc border |
| `#D81D3C`, `#0E0910`, `#FBD95E` | 1 each | Third-party logo colors (ignore) |

Gradients [EXT]: hero glow `white → #391DE8` (blurred ellipses, σ 178 / 89 / 62 / 107); panel `#FCFDFF → #F0F5FF`; fades `#E6F0FF 0→1` and `#002B6B 0→1` (image scrims); one 4-stop ring `#F47E18 → #D6525C → #B8289F → #4A4FE0` (decorative, likely a story/avatar ring — not core).

### 2.4 Effects [EXT unless noted]

| Effect | Offset | Blur σ | Used on |
|---|---|---|---|
| Soft glow | 0, 0 | 178 / 89 / 62 / 107 | Hero + CTA violet gradient blobs |
| Large drop | 10, 25 | 50 | Floating "Why Choose" cards |
| Medium drop | 0, 35 | 22.5 | 24 logo circles |
| Small drop | 8, 8 | 28 | Cards at rest (2×) |
| Tight drop | 0, 16 | 20 | 1 element (selected FAQ card) |

Stroke widths: 1 px (hairlines), 1.5 px (icons, 16×), 2 px (icons, 22×). [EXT]

## 3. PNG findings (visual)

### 3.1 Layout and grid [EXT + EST]

- 1440 canvas, **1240 content**, 100 px gutters.
- **4-column card grid**: card 292 wide, pitch 316 → **gap 24**. Row pitch 266 → **gap 24**. [EXT]
- **2-column FAQ**: 605 + 30 + 605 = 1240 → **gap 30**. [EXT]
- 3-column portfolio: 461 wide, pitch 485 → **gap 24** (3 × 461 + 2 × 24 = 1431; third card bleeds past the container as a carousel). [EXT]
- Hero and section headings are **centered**; "How It Works", "Top Talent…", "What our clients say", "FAQ" are **left-aligned** with the container edge. [EST]
- Vertical rhythm: sections are ~650–1100 px tall; ≈ 100–120 px padding top/bottom [EST]. Backgrounds alternate white / `#FAFAFA` to separate sections without rules.

### 3.2 Visual hierarchy [EST]

1. Oversized headline per section (≈ 56 px, light-medium weight, tight leading), dark `#1E242C`.
2. One subtle grey sub-line (16 px, max ~620 px wide, centered).
3. Content cards: white, 1 px hairline, large radius, no heavy shadow at rest.
4. A single saturated accent (`#0066FF`) for the *one* action per area; selection = pale blue fill + blue border.

### 3.3 Typography [EST]

Both faces look like geometric/neo-grotesque sans families. Closest matches (not confirmed): headings ≈ **Sora / Plus Jakarta Sans-like**, body ≈ **Manrope**. Fallback in practice: Manrope for both. See `design-tokens.md` §3.

### 3.4 Density and contrast

- **Low density**: ≥ 24 px between cards, 60–100 px between blocks, ≤ 8 cards on screen. Good for marketing; **too airy for a study workspace** with long source/chat lists.
- Contrast (computed from [EXT] colors):

| Foreground / background | Ratio | WCAG AA body (4.5) |
|---|---|---|
| `#1E242C` / white | 15.6 | pass |
| `#414D60` / white | 8.6 | pass |
| `#475569` / white | 7.6 | pass |
| `#6C7787` / white | 4.54 | pass (barely); 4.35 on `#FAFAFA` **fail** |
| `#848D9B` / white | 3.35 | **fail** |
| `#0066FF` / white | 4.83 | pass |
| `#0066FF` / `#E6F0FF` (selected chip) | 4.21 | **fail for small text** |
| `#002B6B` / `#E6F0FF` | 11.7 | pass |
| `#EDEEF0` / white (card border) | 1.16 | decorative only; **fails 3:1 for UI boundary** |
| `#8AB9FF` / white (selected border) | 2.0 | fails 3:1 |
| `#FFC805` / white (star) | 1.55 | decorative only, never as the only signal |

- Small text in the reference (skill chips, role under name, "4.8 (6)") is ≈ 12–13 px in `#6C7787`-ish grey. **Do not copy**: the UX audit already flags tiny/low-contrast text (UX-04).

### 3.5 Navigation patterns [EST]

- Top nav on gradient: logo left, 4 text links center, outline pill CTA right. No sticky/active-state info.
- **Category tabs** with icon + label, 1 px bottom rule, active = blue text + blue 2 px underline.
- **Carousel** with two 40 px round arrow buttons (inactive white, active blue).
- Footer: 4 columns, address block + 3 link lists.

## 4. What transfers to MIA, and what does not

| Pattern | Transfers? | Note |
|---|---|---|
| Palette (cool neutrals + one blue) | **Yes** | Maps to existing light/dark theming; verify against current theme tokens first |
| Large radius (20 card, pill controls) | **Yes** | Friendly, fits students; keep scale small (see tokens) |
| Hairline-bordered white cards, no heavy shadow | **Yes** | Good for notebook/folder cards |
| Tab strip with icon + label + underline | **Yes** | Direct fit for the 4 segments CHAT / FUENTES / ARTEFACTOS / ESTUDIO (replaces clipped nav on mobile only if redesigned; see UX-03) |
| Numbered cards (01/02/03) | **Partial** | Useful for onboarding / active-recall steps, not for general lists |
| Accordion cards with `+` / `×` | **Partial** | Support / help content; needs real `aria-expanded` |
| Pill chips | **Yes** | Source type, tag, status |
| Hero violet glow, floating cards, logo wall, testimonial, portfolio carousel, footer | **No** | Marketing-only; MIA has no landing page in scope |
| Photo-heavy cards | **No** | MIA is text/source-centric |
| Tiny grey meta text | **No** | Conflicts with UX-04 |
| Pale-blue selected fill with `#8AB9FF` border | **Adapt** | Fails contrast as-is; darken border (see tokens) |

## 5. Limits of this analysis

- One breakpoint; **no hover, focus, pressed, disabled, loading, error or empty states** exist in the files.
- Fonts unidentified; sizes/weights/line-heights estimated from a raster.
- Shadow color/opacity estimated (matrix alpha truncated).
- No dark mode reference. Open decision #8 in `decisions.md` (light + dark, or one) still applies.
- No table, form, modal, toast or sidebar reference; MIA needs those designed by extension.
