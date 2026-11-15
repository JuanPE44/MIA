# Component Patterns

Source: `redesign/reference/Website.svg` / `.png`. Tags: **[EXT]** exact · **[EST]** visual estimate · **[PROP]** proposed for MIA. Token names refer to `design-tokens.md`. Existing MIA components are listed in `audit/components-inventory.md`.

## 1. Buttons

| Variant | Reference | Tag |
|---|---|---|
| Primary | 150×55, radius 27.5 (pill), fill `#0066FF`, white label ≈ 14–16 px / 500 | [EXT] size, [EST] type |
| Outline | 187×48 / 144×48, radius 24, 1 px stroke (`white` on gradient, `#8AB9FF` on light), label blue | [EXT] |
| Icon (round) | 40×40 circle; inactive white + grey arrow, active `#0066FF` + white arrow | [EXT] + [EST] |
| Trailing-icon | "View All" + 40 px blue circle with ↗ inside the pill | [EST] |

Missing: hover, pressed, disabled, focus, loading, destructive.
**[PROP]** Sizes `md 40`, `lg 48`; radius `md 12` (pill only for primary CTA); states: hover darkens 8 %, focus ring 2 px, disabled 40 % opacity with `aria-disabled`; destructive = danger color (undecided). Label always text (icon-only buttons need `aria-label`).

## 2. Inputs

- Search field: 499×56, radius 28, white, leading icon, placeholder grey `#6C7787`-ish, sits on the gradient with the primary button inside its right edge. [EXT/EST]
- Second pattern: email field inside CTA card with leading mail icon and inline "Join Us" button. [EST]

Missing: label, helper/error text, focus, disabled, textarea, select, file upload, checkbox/radio.
**[PROP]** Visible label above the field; 1 px `color.border.input` (≥ 3:1); focus ring; error = icon + text (never color alone). Needed in MIA for: login, notebook/folder name, chat composer, source upload/link, artifact refinement. Chat composer and upload are **not** in the reference and must be designed.

## 3. Cards

### 3.1 Profile / entity card ("talent card")

292×242, radius 20, white, 1 px `#EDEEF0`. Centered stack: avatar 64 (+ green 10 px status dot at bottom-right), ★ + `4.8 (6)`, name 20/600, role 13 grey, up to 3 chips. [EXT] + [EST]
Selected/hover state: fill `#E6F0FF`, border `#8AB9FF`, soft shadow. [EXT]

**[PROP] → Notebook card**: same shell. Content: title, folder/subject, source count, last-activity date, ≤ 3 tags. Whole card is **one focusable link/button** (fixes UX-02), selected fill uses `primary.tint` + `primary.tint-border` (contrast-corrected), grid `repeat(auto-fill, minmax(260px, 1fr))` with 24 gap. Drop ratings and avatar.

### 3.2 Step card

Wide card (≈ 455×104, radius 20, white, large soft shadow) with 48–56 px colored round icon tile (peach / lime / periwinkle), title 24, caption 16, and an oversized light numeral `01–03` outside the card. [EXT + EST]
**[PROP]**: onboarding / active-recall flow only (3 steps max). Numerals must be decorative (`aria-hidden`), the order conveyed by an `<ol>`.

### 3.3 Floating info card

260×(92–228), radius 20, shadow 10/25/σ50 over a hero photo (title + caption + small CTA). [EXT] — **Not adapted** (marketing).

### 3.4 Media card (portfolio)

461×603, radius 20, image full-bleed + bottom `#002B6B` scrim, name + role in white, round play button. [EXT] — **Not adapted**; MIA has no media cards. If audio sources need one, reuse only the scrim + play button idea.

### 3.5 Testimonial / quote card

716×~500, radius 20, dark `#1E242C`, centered white serif-less quote 32 px, two 40 px round arrows. [EXT + EST]
**[PROP]**: dark card style could host "featured answer / citation block" in chat; contrast 15.6:1 is fine.

## 4. Navigation

| Pattern | Reference | Adapt? |
|---|---|---|
| Top bar | Logo left, 4 text links, outline pill CTA right, on gradient | **Adapt**: logo + notebook/folder breadcrumb + user/theme/focus controls; solid surface, no gradient |
| Category tabs | 7 tabs, icon (20) + label 16, gap ≈ 50, 1 px bottom rule, active = blue text + 2 px blue underline spanning the tab | **Adapt** → MIA segment bar (CHAT / FUENTES / ARTEFACTOS / ESTUDIO) |
| Carousel arrows | Two 40 px circles | Optional; only if a carousel exists |
| Footer | 4 columns (brand+address, Quick links, Others, About us) | **Not adapted** (no footer needed in app; UX audit flags always-on footer) |

**[PROP] segment bar**: `role="tablist"`, arrow-key navigation, label always visible, **horizontal scroll with fade edge** under 640 px instead of clipping (UX-03); active indicator uses 2 px underline **and** weight change (not color alone).

## 5. Chips / tags

25 h, radius 12.5, 1 px border `#EDEEF0`, text 12–13 px. Selected card makes chips blue-bordered with tint fill. [EXT + EST]
**[PROP]**: content chips (source type, status) 28 h, text ≥ 13 px / 500; interactive chips 32 h visual + 44 hit area; icon + text for status (not color only).

## 6. Accordion (FAQ)

605×106 (closed) / ≥ 241 (open), radius 20, 1 px `#E6E9EA`; left 56 px grey circle with number, question 24/29, right `+` (blue). Open: tint fill `#E6F0FF`, blue border, shadow, `×` icon, answer 16/24 in navy-tinted text. Two columns, gap 30. [EXT + EST]
**[PROP]** Use for the support agent help and offline-fallback explanations. Real `<button aria-expanded aria-controls>`; one-column on mobile; number badge optional.

## 7. Tables

**Not present in the reference.** No pattern can be extracted. MIA currently has none either (`components-inventory.md`); stats use `recharts`. If a table appears (e.g., sources list), propose from tokens: 48 px rows, hairline row dividers, sticky header, 14 px text, zebra off.

## 8. Lists with media

Logo circles (60×60, radius 30, white fill, shadow 0/35/σ22.5, 24 per grid in 8/7/6 rows, centered, gap 50) and avatar stacks (3 overlapping 40 px circles + "10K +" metric). [EXT + EST] — marketing only; avatar stack could show collaborators if collaboration ever exists.

## 9. Overlays, feedback, empty/loading/error states

**Absent from the reference.** MIA needs them and the UX audit calls out inconsistency (five feedback mechanisms, ad-hoc modals, UX-05). **[PROP]** (not derived): one `Dialog` primitive (focus trap, Escape, `role="dialog"`, `aria-modal`, radius 20, `shadow.lg`), one `Toast`, one inline `Alert` (icon + text), skeleton using `color.surface.alt`, and empty states using `gradient.panel` + one primary action.

## 10. Responsive behavior

**Cannot be inferred** (one 1440 frame). Only indirect signals: the 4-col grid, 3-col carousel and 2-col FAQ imply column-collapsing; the portfolio bleeding past the container implies horizontal swipe. **[PROP]**: 4 → 3 → 2 → 1 columns at 1280 / 1024 / 640; FAQ 2 → 1 at 768; segment bar scrolls; touch targets ≥ 44. Needs validation against open decision #1 (is mobile primary?).

## 11. Patterns explicitly NOT to copy

- 12–13 px grey meta text and `#848D9B` text (fail AA; UX-04).
- Pale-blue selected border `#8AB9FF` (2:1) and 1.16:1 card borders as the only affordance.
- Fully pill inputs holding long Spanish labels.
- Hero glow / floating cards / logo wall / testimonial / portfolio / footer (marketing).
- Pointer-only affordances (hover-reveal) — no hover states exist, and touch has none.
