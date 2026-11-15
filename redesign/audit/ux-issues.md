# UX Issues Register

Companion to `ux-audit.md` (method, measurements, dimension-by-dimension assessment). Product facts come from `product-map.md`, `routes-and-pages.md`, `user-journeys.md`, `components-inventory.md`.

## How to read this register

**Status**
- **Confirmed** — reproduced in the running app (OBS) and/or verified in source (CODE). The *behavior* is certain. The *impact on real users* is an estimate unless stated.
- **Hypothesis** — plausible from evidence but needs validation with users, analytics or further testing. Each has a validation method.

**Severity** (applied consistently; the first matching rule wins)
- **P0 — Blocking:** a user segment cannot complete a core task with no workaround, **or** the product presents false information as verified fact in its core flow.
- **P1 — High:** core task is possible but hard, error-prone, hidden, or fails for many users; or a violation likely to cause abandonment or distrust.
- **P2 — Medium:** friction, inconsistency or confusion with an easy workaround.
- **P3 — Minor:** polish, copy, low-frequency.

**Scope estimates** are qualitative (All / Most / Some / Few) and based on structure of the product, not analytics — none exist. Every scope is itself a hypothesis until usage data is available.

**Proposals** are UX/behavioral direction only. No code changes, no visual design.

Evidence files live in `redesign/audit/observed/` (screenshots) and `_ux-measurements.json` (raw numbers). `[OBS]` = observed in browser, `[CODE]` = read in source.

Test conditions: Chromium 1440×900 (plus 768, 390, 320 widths), light + dark, **no `GEMINI_API_KEY`** (server offline-fallback paths), seeded "Juan / frecuente" data, desktop pointer.

---

## Summary table

| ID | P | Status | Area | Title |
|----|---|--------|------|-------|
| UX-01 | P0 | Confirmed | Chat | Failed chat requests show a fabricated answer labelled "verified" |
| UX-02 | P0 | Confirmed | Explorer | Notebooks inside folders cannot be opened with the keyboard |
| UX-03 | P1 | Confirmed | Responsive | Workspace overflows horizontally on tablet and mobile; primary controls clipped or off-screen |
| UX-04 | P1 | Confirmed | Accessibility | Most text is tiny or low-contrast in light mode |
| UX-05 | P1 | Confirmed | Overlays | Overlays have no dialog semantics and do not close with Escape |
| UX-06 | P1 | Confirmed (behavior) / Hypothesis (belief) | Support agent | "Reservation registered in the system" is not backed by any storage |
| UX-07 | P1 | Confirmed | Study | Focus mode is hard to find and its entry sequence is mislabelled |
| UX-08 | P1 | Confirmed | Navigation | Reload returns to Login and loses place; URL never changes |
| UX-09 | P1 | Hypothesis | Data | Silent persistence failures can lose user data |
| UX-10 | P1 | Confirmed | Navigation | Three different controls are called "Salir"; "+ Iniciar chat" is duplicated |
| UX-11 | P2 | Confirmed | Layout | Persistent chrome consumes ~22% of the desktop viewport |
| UX-12 | P2 | Confirmed | Dashboard | Same study metrics are shown in three places with different formats |
| UX-13 | P2 | Confirmed | Feedback | Five different feedback mechanisms; some errors are swallowed |
| UX-14 | P2 | Confirmed | Forms | Required-field validation is browser-native, unlabeled inline, and in the browser's language |
| UX-15 | P2 | Confirmed | Content | Demo/test strings and controls are exposed to end users |
| UX-16 | P2 | Confirmed | Chat | Markdown is not rendered in chat answers |
| UX-17 | P2 | Confirmed | Accessibility | Document semantics: wrong `lang`, no `h1`, no `nav`, unlabeled inputs, icon-only buttons |
| UX-18 | P2 | Confirmed | Accessibility | Many controls are below touch/pointer target minimums |
| UX-19 | P2 | Confirmed | Explorer | Moving/deleting notebooks depends on right-click |
| UX-20 | P2 | Confirmed | Language | Mixed Spanish/English interface vocabulary |
| UX-21 | P2 | Confirmed | Mobile | Support button overlaps the chat input on small screens |
| UX-22 | P2 | Hypothesis | Information architecture | Three separate "ask" surfaces (Chat, Google agent, Support agent) |
| UX-23 | P2 | Hypothesis | Accessibility | Focus mode locks Tab and Escape keys |
| UX-24 | P2 | Confirmed | Destructive actions | Native `confirm()` dialogs, no undo, tiny delete targets |
| UX-25 | P3 | Confirmed | Empty states | Empty-notebook guidance is duplicated across tabs |
| UX-26 | P3 | Confirmed | Artifacts | Artifact configuration exposes ~23 options |
| UX-27 | P3 | Confirmed | Chat | Single-line chat input; cannot write multi-line questions |
| UX-28 | P3 | Hypothesis | Plan | Plan/billing labels without any plan functionality |
| UX-29 | P3 | Hypothesis | Meaning | Unexplained status dot on "Google Search" |
| UX-30 | P3 | Confirmed | Chat | The last chat thread cannot be deleted, explained by a native alert |

Counts: P0 2 · P1 8 · P2 14 · P3 6 (30 total). Hypothesis-only: 5 (UX-09, 22, 23, 28, 29). Mixed confirmed behavior + hypothesized impact: 4 (UX-06, 19, 20, 26). Fully confirmed: 21.

---

## P0

### UX-01 — Failed chat requests show a fabricated answer labelled "verified"
- **Page / feature:** Notebook → CHAT (`NotebookChat`)
- **Observed problem:** When `/api/chat` fails (HTTP 500, or the network request is aborted), the client does not show an error. It builds an assistant message locally, opening with "Basado estrictamente en los documentos cargados", attaches a citation chip, a "Citas Verificables (1)" block and the line "Haz clic para comprobar que no inventó nada". The body is a truncated snippet of the first source ("…Construir: Transformar ideas e hipóte…") regardless of what was asked.
- **Evidence:** [OBS] forced 500 → `ux-63-chat-error.png`; forced network failure → `ux-64-chat-network-fail.png`; both asked unrelated questions ("prueba de error", "prueba offline") and received the same Lean Startup passage with verification badges. [CODE] `NotebookChat.tsx:192–199` builds the message inside `catch`. The page also advertises "Protección y Fidelidad: Anclaje a fuentes · Manejo estricto de citas · Sin alucinaciones" under the input.
- **User impact:** A student can read an irrelevant passage as the answer to their question and trust it because it carries verification affordances. It contradicts the product's central promise (grounded, cited answers) at exactly the moment the system cannot deliver it.
- **Frequency / scope:** Every chat failure (backend down, rate limit, slow/offline network, missing key). Estimate: Some users, intermittently; All users if deployed without a working key. High consequence per occurrence.
- **Severity:** P0 (false information presented as verified in the core flow).
- **Proposal:** Treat failure as an explicit state: keep the user's message, show a clear non-answer status ("No pude responder — reintentar") with a retry action, and never use grounding/verification styling for content that was not produced and cited by the answering service. If an offline mode is intended, label it unmistakably as a different kind of response and make it relevant to the question or omit it. Validate with users which failure messaging they find credible and actionable.

### UX-02 — Notebooks inside folders cannot be opened with the keyboard
- **Page / feature:** Explorer (`NotebooksExplorer`)
- **Observed problem:** Notebook cards are plain `div` elements with a click handler: no `tabindex`, no role, no key handling. In the seeded data the only notebook lives inside a folder, and the Explorer exposes 14 focusable controls, none of which opens a notebook. Loose notebooks do have an "Opciones de cuaderno" (⋮) button whose menu contains "Abrir Cuaderno" [CODE `NotebooksExplorer.tsx:481`]; folder-contained notebooks have no equivalent control.
- **Evidence:** [OBS] `kbd-notebook-card-semantics = {tag: DIV, tabindex: null, role: null}`; Tab order from first control reaches theme switch, Google Search, Soporte IA, Salir, + Nueva Carpeta, + Nuevo Cuaderno, then the search field. Notebook cards inside folders are never in the sequence. [CODE] click/contextmenu handlers at `NotebooksExplorer.tsx:378–379`.
- **User impact:** Keyboard-only users and screen-reader users cannot enter the notebook workspace — i.e., cannot reach any feature other than creating a notebook — for any notebook that is in a folder. No workaround exists in the UI.
- **Frequency / scope:** Few users by headcount (assistive-technology and keyboard-only), but 100 % of those users are blocked at the entry to the product. Also affects switch-device and some voice-control users. Legal/institutional accessibility obligations may apply for a university audience (hypothesis; confirm with the institution).
- **Severity:** P0 (blocking, no workaround for a segment).
- **Proposal:** Every notebook, wherever it is shown, must be a single focusable, named, operable "open" target with the same behavior as click, and its secondary actions (move, delete) must be reachable by keyboard. Validate with at least two keyboard/screen-reader users on the open-notebook and move-notebook tasks.

---

## P1

### UX-03 — Workspace overflows horizontally on tablet and mobile; primary controls clipped or off-screen
- **Page / feature:** All logged-in screens; strongest in Workspace
- **Observed problem:** At 768 px the workspace is 882 px wide. At 390 px it is 521 px (Explorer 456 px). At 320 px Login itself is 362 px. At 390 px and below the tabs ARTEFACTOS and ESTUDIO are clipped; in the header only back, theme switch and the Google icon are visible — "Soporte IA", username, streak/minutes and "Salir" are pushed beyond the viewport.
- **Evidence:** [OBS] `responsive-768/390/320` in `_ux-measurements.json`; `ux-71-chat-390.png`, `ux-72-*`, `52-chat-mobile.png`. Offending element: the top header row (right edge at 882 px / 521 px).
- **User impact:** On a phone, two of four main sections are not visible without sideways page scroll; logging out and support are not discoverable. Content cards and chat feel cut off. Users may conclude the app is desktop-only.
- **Frequency / scope:** All users on viewports ≤ 768 px. Share of mobile usage is unknown — for a student audience it is plausibly Most (hypothesis; check device analytics or ask).
- **Severity:** P1 (core navigation hidden; workaround = horizontal scrolling). Becomes P0 if mobile is a primary platform.
- **Proposal:** Decide the supported viewport range first. Then make section navigation always fully visible (or reachable in one obvious control) and ensure the account/support/logout actions are discoverable at every width, with no horizontal page scroll. Validate with 5 users completing "open a notebook → go to Artefactos → ask a question" on a phone.

### UX-04 — Most text is tiny or low-contrast in light mode
- **Page / feature:** All screens
- **Observed problem:** Text smaller than 12 px makes up 47 % of text nodes in Chat (41/87), 37 % in Fuentes (59/158), 51 % in Artefactos (58/113), 40 % in Estudio (59/148), 31 % in Explorer (24/77). Sizes go down to 9 px. An approximate contrast scan flags 14–28 % of text nodes below WCAG AA in light mode (Explorer 20/77, Chat 19/85, Fuentes 20/141, Artefactos 29/103, Estudio 20/131), with the lowest around 2.5:1 (e.g., "Quiz" label 2.47, "Contenedores temáticos de cuadernos" 2.51, "Acceso directo a tus carpetas" 2.63). The inactive "Negro" toggle label is 4.35:1 on every screen. Dark mode is better (4/77 Explorer, 12/85 Chat).
- **Evidence:** [OBS] `a11y-*` entries in `_ux-measurements.json`. Method caveat: contrast is computed from computed styles with alpha compositing; text over images/gradients is skipped when detected, but some text over image banners still reads as ratio ≈1.0 (measurement artefact, visible in the Explorer sample), so the Explorer figure in particular is overstated. Treat all percentages as directional.
- **User impact:** Labels, timestamps, counters and helper text are hard to read for everyone, severely so for low-vision users and in bright environments. Key status information (counts, section labels) sits in the smallest type.
- **Frequency / scope:** All users, every session.
- **Severity:** P1.
- **Proposal:** Define a minimum readable text size and a contrast floor for all informational text, applied equally to light and dark; reserve the smallest sizes for truly decorative or redundant labels. Validate with a legibility test on 3–5 participants including one low-vision user.

### UX-05 — Overlays have no dialog semantics and do not close with Escape
- **Page / feature:** New folder modal, New notebook modal, Profile modal, Google Search agent, Support panel
- **Observed problem:** None of the measured screens exposes `role="dialog"` or `aria-modal`. Escape did not close New Folder, Profile, or the Google Search agent. Focus does move into the first field when New Folder opens (good); focus return on close and focus trapping were not verified.
- **Evidence:** [OBS] `modal-newfolder = {role: 0, escapeClosed: false}`; Escape on the Profile modal and Google Search agent was confirmed in the earlier discovery run (`24b-after-escape`, profile step). [CODE] 11 hand-written `fixed inset-0` containers (see `components-inventory.md`).
- **User impact:** Screen-reader users are not told a dialog opened; keyboard users must find the specific close control; everyone expects Escape to dismiss. Background content stays reachable by Tab (unverified).
- **Frequency / scope:** All users who use keyboard or assistive tech; Some others who expect Escape. Occurs on every overlay.
- **Severity:** P1.
- **Proposal:** One consistent overlay behavior across the product: announced as a dialog, dismissible with Escape and an obvious close control, contains focus while open and returns it to the trigger on close. Validate with keyboard and screen-reader walkthroughs.

### UX-06 — "Reservation registered in the system" is not backed by any storage
- **Page / feature:** Support agent (`SupportAgentChatbot`)
- **Observed problem:** The assistant says "Tu reserva ha quedado formalmente registrada en el sistema… He sincronizado la cita con tu perfil" and renders a reservation card (id, type, subject, date/time, host/room). No code path persists or transmits a reservation: the server has no storage primitives, and the client writes to localStorage only from `App.tsx` for folders, notebooks, stats, profile and theme — not support messages.
- **Evidence:** [CODE] `server.ts:1300` (text); grep of `server.ts` finds no file/db/map persistence; `localStorage.setItem` occurs only in `App.tsx`. [OBS] chips "📅 Reservar tutoría 1 a 1", "🏢 Reservar sala de estudio" are offered. The conversation was exercised only up to the opening state, so the exact card was not rendered in the browser.
- **User impact:** If users believe the booking exists, they will not show up where expected, or will rely on a room/tutor that was never reserved. The conversation and card also vanish on close/reload.
- **Frequency / scope:** Every reservation flow. Whether real users act on it is a **hypothesis** (needs validation); the lack of a backing record is **confirmed**.
- **Severity:** P1 (false confirmation in a transactional flow).
- **Proposal:** Either connect the flow to a real booking record visible somewhere in the app, or clearly present it as a request/simulation. Decide the product intent first. Validate with users what they expect to see after "booking" and where.

### UX-07 — Focus mode is hard to find and its entry sequence is mislabelled
- **Page / feature:** ESTUDIO → "Pomodoro (Focus mode)"
- **Observed problem:** The tab is called "Pomodoro (Focus mode)". Starting leads through "Iniciar ciclo pomodoro" → "Iniciar Concentración", which only starts the timer (the button changes to "Pausar Etapa"; header and tabs remain). The actual Focus mode is a separate "Focus mode" button below the session log with the hint "Haz clic en Focus mode para bloquear distracciones externas", at roughly y = 760 of a 900 px viewport. A 5-click path from an open notebook starts the timer; Focus mode needs at least one more.
- **Evidence:** [OBS] `task-start-focus-clicks-from-login = 6`; `ux-80-focus-after-start.png` shows the timer running with all chrome visible. The audit's own first discovery pass attributed Focus mode to "Iniciar Concentración" — an instance of the same confusion. Activation of Focus mode itself was not exercised.
- **User impact:** The product's differentiating promise ("distraction-proof environment") can be missed or assumed active when it is not. Users who believe they are protected will not be.
- **Frequency / scope:** Everyone who starts a study session. Estimate: Most Study-tab users.
- **Severity:** P1.
- **Proposal:** Make the relationship between timer and Focus mode explicit and unambiguous: one clear start action whose label states what will happen, and a persistent, unmistakable indicator of whether Focus mode is on. Validate with users: "start a protected 25-minute session" — measure time and whether they believe protection is on.

### UX-08 — Reload returns to Login and loses place; URL never changes
- **Page / feature:** App-wide navigation
- **Observed problem:** The URL is `/` on every screen. On load the app clears its session marker and shows Login, even though folders/notebooks persist locally. Position (notebook, tab), chat draft and timer state are component state and are not restored. Browser Back leaves the app rather than stepping back.
- **Evidence:** [OBS] `location.pathname` is `/` on every screen. [CODE] `App.tsx` (mount effect removes `focused_auth_user`; `currentUser` initial state `null`). Reload behavior was verified from code, not by reloading in the browser.
- **User impact:** An accidental refresh or tab discard (frequent on phones and during a Pomodoro) throws the user back to the start and may reset an in-progress session. No deep links or shareable locations; Back/forward do not match mental models.
- **Frequency / scope:** Some users, each time it happens; consequences higher during timed study.
- **Severity:** P1.
- **Proposal:** Decide how much state should survive refresh (at minimum: signed-in state and current notebook/section; for study sessions, the running timer) and whether sections should have addressable locations. Validate with a "refresh in the middle of a session" scenario.

### UX-09 — Silent persistence failures can lose user data
- **Page / feature:** All user data (folders, notebooks, sources, artifacts, chats, stats)
- **Observed problem:** Everything is stored in the browser's localStorage, including uploaded files as base64 strings inside notebooks. Every persistence write is wrapped in `try { … } catch { // ignore }`, so a failed write (quota, private mode) gives no message.
- **Evidence:** [CODE] `App.tsx` ~266–296 (three silent catches), `SourceItem.fileDataUrl` in `types/index.ts`. [OBS] none — quota behavior was **not** reproduced.
- **User impact (if it occurs):** Uploaded PDFs/images could silently stop being saved, with the user discovering the loss on next load. Data is also per-browser and per-device.
- **Frequency / scope:** Unknown. Plausible for users who upload several PDFs or images.
- **Severity:** P1 (data loss potential) — **Hypothesis**.
- **Proposal / validation:** Test quota behavior with realistic uploads to confirm. If confirmed, the product needs to tell users when something is not saved and set expectations about where data lives.

### UX-10 — Three different controls are called "Salir"; "+ Iniciar chat" is duplicated
- **Page / feature:** Workspace → CHAT
- **Observed problem:** The chat view shows "Salir" in the navbar (log out of the app), "Salir" in the notebook banner (back to folders), and "Salir del chat" in the chat panel (back to folders). "+ Iniciar chat" appears twice (banner and chat header).
- **Evidence:** [OBS] button inventory in the chat view (`10-chat.png`); titles "Salir de la aplicación" vs "Salir del chat y volver a las carpetas".
- **User impact:** A user who wants to leave the chat may log out, or vice versa. Duplicate controls make the screen look busier and the model of "where am I" fuzzier.
- **Frequency / scope:** All users in Chat; likelihood of mis-click is a hypothesis to test.
- **Severity:** P1 (destructive-sounding action collides with navigation; consequence is mild since data persists, hence not P0).
- **Proposal:** One distinct name per action ("Cerrar sesión" for the account, a navigation label for returning to folders), and one place per action. Validate with a first-click test: "Go back to your folders" and "Sign out".

---

## P2

### UX-11 — Persistent chrome consumes ~22 % of the desktop viewport
- **Feature:** Layout (Navbar, segment tabs, bottom bar, support button)
- **Problem:** The header (navbar + tabs) is ~118 px tall and the fixed bottom bar ~83 px (~22 % of 900 px); on a 844 px phone the bottom bar alone is 79–90 px. On top of that: notebook banner above the content, and a floating button. The navbar holds ~11 controls in one row.
- **Evidence:** [OBS] `responsive-*` `fixedBottom`; screenshots (header ends y≈118; bottom bar starts y≈818).
- **Impact:** Less room for chat/reading, especially on laptops with short viewports and on phones. Competes with focus on the task.
- **Scope:** All users, every screen. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Define what must be always visible versus contextual; remove duplicated items before deciding how to lay out what remains. Validate with a content-density comparison on a 13" laptop.

### UX-12 — Same study metrics are shown in three places with different formats
- **Feature:** Navbar chips, bottom bar, Estudio tiles, Profile modal
- **Problem:** Streak and minutes appear as "6d / 55m" (navbar), "🔥 6 días / ⏱️ 55m / 60m hoy" (bottom bar) and "55m / 6 días / 11 bloques / 3 bloqueos tab" tiles (Estudio). "Bloqueos tab" is unexplained.
- **Evidence:** [OBS] `02-explorer.png`, `43-focus-mode.png`. **Impact:** Visual noise; inconsistent unit/format; unclear what the numbers mean or whether they refer to the notebook or the whole account (they are global, [CODE]). **Scope:** All. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** One canonical place and format for each metric; say plainly whether it is per-notebook or overall.

### UX-13 — Five different feedback mechanisms; some errors are swallowed
- **Feature:** App-wide feedback
- **Problem:** Feedback comes via: custom toasts (source processing, focus warning), native `alert()` (4 sites: missing sources for artifact/recall, "each notebook must have at least one chat"), native `confirm()` (6 sites), the browser's required-field bubble (UX-14), and inline empty-state text. The second `/api/chat` call site (`NotebookChat.tsx:251–275`) catches errors with `// Ignore`, so a failure there produces no message; the spinner just stops.
- **Evidence:** [CODE] sites listed above; [OBS] confirm dialogs fired for folder, source, artifact deletion; disabled "Elaborar…" button with explanatory text when a notebook has no sources.
- **Impact:** Inconsistent look/timing; native dialogs block the page and cannot be styled or localized with the app; failed actions can look like nothing happened. **Scope:** All. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Define one feedback vocabulary (inline for field problems, transient for success/info, persistent with retry for failures, a single pattern for confirming destruction). Validate which failure messages users understand.

### UX-14 — Required-field validation is browser-native, not inline, and in the browser's language
- **Feature:** New folder / New notebook forms (and likely Add source)
- **Problem:** Submitting "Crear Carpeta" or "Crear Cuaderno" with an empty name shows the browser bubble "Please fill out this field." (English in this test, because `lang` is `en` and the browser locale is English). The primary buttons are not disabled; there is no inline error text, no description of constraints.
- **Evidence:** [OBS] `ux-60-validation-folder.png`; `validation-notebook-empty = {disabled: false, requiredAttrs: 1}`. Add-source form empty-save behavior was **not** verified.
- **Impact:** Language mismatch with the Spanish UI; message disappears after a moment and is not announced consistently by assistive tech. **Scope:** All users creating items. **Severity:** P2. **Status:** Confirmed (folder, notebook).
- **Proposal:** Inline, Spanish, persistent field-level messages tied to the field; define required vs optional fields explicitly. Validate Add-source and Artifact config forms as well.

### UX-15 — Demo/test strings and controls are exposed to end users
- **Feature:** Explorer, Study, Profile
- **Problem:** "EXPLORADOR DE ESTUDIO · **Perfil Frecuente (Modelado)**"; Pomodoro screen shows "**A MODO DE PRUEBA** — Probar avance: +1 min, +10 min, Fin Etapa (Prueba), 1s = 1m"; Profile has "Restablecer datos de prueba". After deleting everything the Explorer greets a frequent user with "Has iniciado sesión como **Usuario nuevo**".
- **Evidence:** [OBS] `02-explorer.png`, `43-focus-mode.png`, `ux-90-explorer-empty.png`, `22-profile-modal`. **Impact:** Undermines credibility; test controls let users inflate progress/streak metrics (XP, minutes) — the data the product uses to motivate. **Scope:** All. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Clarify which of these are intentionally part of the product (e.g., a demo mode) and separate them from the real experience. Confirm with the product owner.

### UX-16 — Markdown is not rendered in chat answers
- **Feature:** Chat
- **Problem:** Assistant text shows literal `**condiciones de incertidumbre extrema**`. Other text in the same bubble is formatted (citation chips), so formatting support is partial.
- **Evidence:** [OBS] `10-chat.png`, `52-chat-mobile.png`, `51-chat-dark`. **Impact:** Looks broken/unfinished in the product's most-used feature; emphasis is lost. **Scope:** Most chat answers that contain emphasis. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Define the text formatting the assistant may use and make sure the chat renders exactly that set.

### UX-17 — Document semantics: wrong `lang`, no `h1`, no `nav`, unlabeled inputs, icon-only buttons
- **Feature:** All screens
- **Problem:** `<html lang="en">` for a Spanish UI; Login has one `h1`, every other screen has none; there is no `nav` landmark (only `main`/`header`); one unlabeled field per screen (Explorer search, chat input, Estudio select); 2–10 visible controls per screen are icon-only and named only by `title`. Images all have `alt`; all buttons have some name.
- **Evidence:** [OBS] `a11y-*` (`lang:"en"`, `h1:0`, `nav:0`, `unlabeled:1`, `titleOnly:2/6/6/10/0`). **Impact:** Screen readers mispronounce text, cannot navigate by headings/landmarks, and `title` is not reliably announced or reachable on touch. **Scope:** AT users (Few) but pervasive. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Give every screen a clear heading structure and landmarks, set the document language correctly, name every control and field.

### UX-18 — Many controls are below touch/pointer target minimums
- **Feature:** All screens
- **Problem:** Counting visible buttons/links under 44 × 44 px: Explorer 12, Chat 23, Fuentes 31, Artefactos 27, Estudio 18. Under 24 × 24 px (WCAG 2.2 minimum): Chat 9 (e.g., thread delete "×"), Fuentes 2, Artefactos 2, Estudio 2.
- **Evidence:** [OBS] `smallTargets` / `under24` in `_ux-measurements.json` (desktop sizes; mobile not measured). **Impact:** Mis-taps, especially on phones and for users with motor impairments; delete controls near selection controls amplify risk. **Scope:** All touch users. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Establish a minimum target size and spacing rule, tightest for destructive actions.

### UX-19 — Moving/deleting notebooks depends on right-click
- **Feature:** Explorer
- **Problem:** The header copy teaches "clic derecho para moverlo o sacarlo de una carpeta". Notebooks have a ⋮ "Opciones de cuaderno" button only in the loose list, not inside folders. Touch devices have no right-click.
- **Evidence:** [OBS] `21-context-menu.png` (menu: Abrir, move to each folder, Sacar de carpeta, Eliminar); [CODE] button at `NotebooksExplorer.tsx:481`. **Impact:** Primary organization actions are hidden for touch and keyboard users; discoverability relies on reading helper text. **Scope:** Most touch/keyboard users. **Severity:** P2. **Status:** Confirmed (right-click path), Hypothesis (touch behavior — not tested).
- **Proposal:** Every notebook offers its actions in a visible, consistent, accessible way.

### UX-20 — Mixed Spanish/English interface vocabulary
- **Feature:** All
- **Problem:** "Focus mode", "Google Search", "Quiz", "Cards", "Slides", "Active Recall", "Pomodoro", "Blanco/Negro" (for light/dark, unconventional) appear inside an otherwise Spanish UI; artifact types mix full names and abbreviations (Resumen, Quiz, Cards, Guía, Examen, Audio, Infografía, Slides).
- **Evidence:** [OBS] button inventories. **Impact:** Inconsistent mental model and search/Help language; may be fine for the target audience (**Hypothesis**: validate whether students use these English terms natively). **Scope:** All. **Severity:** P2. **Status:** Confirmed (existence), Hypothesis (impact).
- **Proposal:** Pick a glossary with the audience and apply it everywhere.

### UX-21 — Support button overlaps the chat input on small screens
- **Feature:** Mobile Chat
- **Problem:** The floating "?" button sits over the right end of the input row, near the send/Google buttons; the bottom bar also covers content.
- **Evidence:** [OBS] `52-chat-mobile.png`. **Impact:** Overlap with the most-used control; risk of opening Support instead of sending. **Scope:** All mobile chat users. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Floating elements must never cover primary task controls at any width.

### UX-22 — Three separate "ask" surfaces (Chat, Google agent, Support agent) — Hypothesis
- **Feature:** Information architecture
- **Problem:** Notebook Chat (grounded in sources), the Google Search agent (web, opened from navbar or chat), and the Support agent (help/bookings, floating button and navbar) all converse, each with its own history, modes and persistence (only Chat history persists). Users must decide which to ask.
- **Evidence:** [OBS] three entry points; [CODE] separate message state per component. **Impact:** Possible confusion about where to ask and why answers differ in trust level; unverified. **Severity:** P2. **Status:** Hypothesis.
- **Validation:** Task-based test: "find out the latest news about X and add it to your notebook", "ask a question about your PDF", "book a tutor" — observe which surface users start in and what they expect.

### UX-23 — Focus mode locks Tab and Escape keys — Hypothesis
- **Feature:** Focus mode
- **Problem:** Activation asks the browser to lock `Tab`, `Alt`, `Meta`, `Escape` and `D` keys and enter full screen.
- **Evidence:** [CODE] `App.tsx:169`. Not exercised in the browser.
- **Impact:** Keyboard-only and assistive-tech users may be unable to navigate or exit; anyone may be unsure how to leave. **Severity:** P2. **Status:** Hypothesis.
- **Validation:** Test Focus mode activation and exit with keyboard only and a screen reader; confirm an exit path is always visible.

### UX-24 — Native `confirm()` dialogs, no undo, tiny delete targets
- **Feature:** Deleting folders, notebooks, sources, artifacts, chat threads; resetting data
- **Problem:** All six destructive actions use the browser `confirm()` and are irreversible. Chat-thread deletion is a small "×" next to thread names. Positive: every destructive action does ask first, and the folder message explains notebooks are kept.
- **Evidence:** [OBS] dialogs fired for folder/source/artifact; [CODE] six sites. **Impact:** Inconsistent with app visuals, not localizable, easy to dismiss by reflex; no recovery from a mistaken OK. **Scope:** All. **Severity:** P2. **Status:** Confirmed.
- **Proposal:** Pick one consistent confirmation pattern, with clear consequences stated, and consider an undo window for low-cost actions.

---

## P3

### UX-25 — Empty-notebook guidance is duplicated across tabs
- **Problem:** A new notebook shows "Antes de trabajar con este contenido, necesito que cargues al menos una fuente…" in both Chat and Fuentes, plus "Sin fuentes cargadas" in the banner and "0 de 0 fuentes tildadas". The guidance itself is good (clear CTA "Cargar Fuentes Ahora") and the artifact button is disabled with an explanation.
- **Evidence:** [OBS] `ux-91`, `ux-92`, `ux-93`. **Severity:** P3. **Status:** Confirmed. **Proposal:** One clear next step per screen.

### UX-26 — Artifact configuration exposes ~23 options
- **Problem:** Quality (4), Format (4), Length (3), highlight color (6) and six toggles, plus "Editar fuentes a utilizar". Defaults are prefilled and an artifact can be created in 3 clicks from an open notebook.
- **Evidence:** [OBS] `33-artefactos-param-quiz`, `task-generate-quiz-clicks-from-login = 5`. **Impact:** Possible decision fatigue; **Hypothesis**: whether users change any of them. **Severity:** P3. **Status:** Confirmed (count) / Hypothesis (impact).
- **Validation:** Log or observe which options users change; test a "quick create" vs "customize" model.

### UX-27 — Single-line chat input
- **Problem:** The question field is `input[type=text]`, so Shift+Enter cannot insert new lines; "Presiona Enter para enviar".
- **Evidence:** [OBS] input inventory. **Impact:** Long or structured questions (pasting problem statements) are awkward. **Severity:** P3. **Status:** Confirmed.

### UX-28 — Plan/billing labels without any plan functionality — Hypothesis
- **Problem:** "Plan Pro", "Plan Universitario Pro", "Estado de Cuenta" are shown; no billing, upgrade or limits were found.
- **Evidence:** [OBS] bottom bar, Profile; [CODE] strings only. **Impact:** Sets expectations of account features that do not exist. **Severity:** P3. **Status:** Hypothesis (depends on product intent).

### UX-29 — Unexplained status dot on "Google Search" — Hypothesis
- **Problem:** A small green dot sits on the Google Search chip; its meaning (connected? online?) is not stated. The title text says "Conectar a la Búsqueda de Google en tiempo real".
- **Evidence:** [OBS] header screenshots. **Severity:** P3. **Status:** Hypothesis (check if it reflects real state; it also shows without an API key).

### UX-30 — The last chat thread cannot be deleted, explained by a native alert
- **Problem:** Deleting the only thread shows `alert("Cada cuaderno debe tener al menos un chat activo.")`.
- **Evidence:** [CODE] `App.tsx:668`. **Severity:** P3. **Status:** Confirmed. **Proposal:** Prevent the impossible action instead of explaining it afterwards, or allow it.

---

## Positive findings to preserve (observed working well)
- Login has one unmistakable action ("Empezar") and a short welcome.
- Chat shows a loading state (spinner, send disabled) and an empty send is disabled [OBS].
- Empty-notebook screens give a concrete next step ("Cargar Fuentes Ahora"); the artifact button is disabled with an explanation [OBS].
- Generating an artifact takes 3 clicks from an open notebook and opens the result automatically [OBS].
- Destructive actions ask for confirmation, and the folder-delete message states notebooks are kept [OBS].
- Citations are surfaced as chips with source and location, supporting verification when real [OBS].
- Focus lands in the first field when New Folder opens; keyboard focus rings are visible on buttons [OBS].
- Dark mode contrast is clearly better than light mode (UX-04 numbers) [OBS].

## Hypotheses that need user research (summary)
| ID | Question to answer | Method |
|----|--------------------|--------|
| UX-03 | What share of sessions are mobile? | Analytics / quick survey |
| UX-06 | What do users believe a "booked" reservation means? | 5-user task test |
| UX-07 | Do users know whether Focus mode is on? | Moderated session, think-aloud |
| UX-09 | Do realistic uploads exceed storage? | Technical test with real PDFs/images |
| UX-20 | Which terms do students use naturally? | Card sort / interview |
| UX-22 | Which surface do users pick for each question type? | First-click tests |
| UX-23 | Can keyboard/AT users enter and exit Focus mode? | Accessibility test |
| UX-26 | Which artifact options are ever changed? | Observation / usage logs |
