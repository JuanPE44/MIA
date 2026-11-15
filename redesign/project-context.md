# Project Context — MIA (Mi Inteligencia Artificial / FocusEd Copilot)

Read-only analysis for the redesign project. No app files were modified.

## 1. Repository structure

```
server.ts                 Express API + Vite middleware (single process, port 3000)
index.html                Vite entry (lang="en" but UI is Spanish)
src/main.tsx              createRoot -> <App />, imports index.css
src/App.tsx               1146 lines — state hub + view switching
src/index.css             64 lines — Tailwind import + dark-mode overrides only
src/types/index.ts        domain types
src/data/initialData.ts   seed folders / notebooks / stats / profile
src/services/audioSynthesizer.ts   Web Audio ambient sounds
src/components/*.tsx      11 components (see §5)
src/assets/images/        8 jpg (banners, avatar, hero)
public/assets/aistudio/   favicon + 1 png
.aistudio/                AI Studio artifacts (ignore)
```

Git: single commit on `main`, clean tree. Package manager: `bun.lock` present, README says `npm`.

## 2. Stack

| Area | Tech |
|---|---|
| UI | React 19, TypeScript (`typescript@^7`, `tsc --noEmit` only) |
| Build | Vite 8, `@vitejs/plugin-react`, `@tailwindcss/vite` |
| Styling | Tailwind CSS v4 (no config file; CSS-first) |
| Icons / motion / charts | `lucide-react`, `motion`, `recharts` |
| Backend | Express 4 + `tsx`, `@google/genai` (model `gemini-3.8-flash`), `pdf-parse` |
| Origin | Google AI Studio export (`metadata.json`, `DISABLE_HMR` logic in `vite.config.ts` — do not touch) |

## 3. Frontend architecture

- **No router, no state library, no context.** `App.tsx` owns all state and passes it as props.
- View model: `currentUser` null → `LoginScreen`; else `currentView` (`'explorer' | 'workspace'`) and, inside a workspace, `activeSegment` (`CHAT | FUENTES | ARTEFACTOS | ESTUDIO`). Overlays: `StudentProfileModal`, `SupportAgentChatbot`, `GoogleSearchAgent`, focus mode (`isFocusModeActive` hides navbar/chrome).
- Data layer: components call `fetch('/api/...')` directly; no API client abstraction.
- Persistence: localStorage (`focused_folders_frecuente_v2`, `focused_notebooks_frecuente_v2`, `focused_user_stats_frecuente`, `mia_student_profile`, `mia_theme_mode`); `sessionStorage` `focused_auth_usertype`. Login is fake (no password; `onLoginSuccess('Juan','frecuente')` after a 250 ms timeout).
- Server falls back to canned Spanish replies when `GEMINI_API_KEY` is missing -> the app is fully navigable and screenshot-able **without an API key**.

## 4. Routing

None. All navigation is React state; the URL is always `/`. Consequences for the redesign: no deep links, no back-button behavior, and automation must click through the UI. Adding a router would be an architectural change — decide explicitly.

## 5. Component organization

Flat `src/components/`, no atoms/molecules layers, no shared primitives (Button, Card, Modal, Input are re-implemented inline everywhere).

| File | Lines |
|---|---|
| NotebookArtifacts | 1797 |
| NotebookMethods | 1363 |
| NotebookSources | 1188 |
| App | 1146 |
| NotebookChat | 871 |
| NotebooksExplorer | 814 |
| GoogleSearchAgent | 660 |
| SupportAgentChatbot | 487 |
| WeeklyStudyChart | 440 |
| StudentProfileModal | 372 |
| Navbar | 289 |
| LoginScreen | 217 |

Components are large and mix data fetching, state, and markup — redesign will touch logic-heavy files.

## 6. UI libraries and styling

- Tailwind utility classes inline in JSX (135 files-lines of `className`, ~all components). A few inline `style={{}}` (NotebookMethods, NotebookArtifacts, NotebooksExplorer).
- **Dark mode**: `@custom-variant dark` keyed on `html.dark`; toggled in `App.tsx` and persisted in `mia_theme_mode`. **But** many components also branch on an `isDarkMode` prop with ternaries (`isDarkMode ? 'bg-slate-950' : 'bg-white'`: LoginScreen 15, Navbar 17, NotebooksExplorer 14, NotebookChat 7, App 4) in addition to `dark:` classes (~400 occurrences; heaviest in NotebookMethods 137, StudentProfileModal 68, NotebooksExplorer 68). Two parallel theming mechanisms.
- Labels: "Blanco" / "Negro" theme switcher.

## 7. Existing design system

**None.** No tokens, no `@theme` block, no CSS variables beyond `color-scheme`, no font loading (system font stack), no component library.

Observed de-facto palette (Tailwind class counts): slate 1403, indigo 544 (primary), emerald 244, amber 200, purple 160, rose 122, sky 62, orange/blue/fuchsia marginal. Hard-coded hex only in `index.css` (`#ffffff`, `#0f172a`, `#020617`, `#f8fafc`). `index.css` forces global text colors in light/dark and styles native form controls.

Other quirks: `index.html` `lang="en"` vs Spanish UI; `package.json` name is `react-example`; `metadata.json` name is "Remix Remix Versión 1.4…".

## 8. Testing

None: no unit/e2e tests, no vitest/jest/playwright/cypress config, no ESLint/Prettier, no Storybook. Only `npm run lint` = `tsc --noEmit`. Almost no `data-testid`/`aria-label` (a handful: App 1, SupportAgentChatbot 1) -> selectors will rely on visible Spanish text/roles.

## 9. Local execution

```
npm install        # or bun install  (node_modules already present, 18 entries)
cp .env.example .env.local   # GEMINI_API_KEY optional (fallbacks work without)
npm run dev        # tsx server.ts -> http://localhost:3000
npm run build      # vite build -> dist/
npm run lint       # tsc --noEmit
```
Node v24.11.1, bun available. Production: `NODE_ENV=production tsx server.ts` serves `dist/`.

## 10. Screenshot / navigation automation

Feasible. Findings:
- Playwright browsers already cached in `~/Library/Caches/ms-playwright` (chromium 1243/1248, headless shell, ffmpeg) -> install only the `playwright` / `@playwright/test` npm package (devDependency or run via `npx` from a separate scripts dir to avoid touching app deps).
- Deterministic start: seed data from `initialData.ts` + localStorage; theme via `localStorage.mia_theme_mode` or `html.dark`.
- Flow to capture: Login ("start" button -> Juan/frecuente) -> Explorer -> open notebook -> segments CHAT / FUENTES / ARTEFACTOS / ESTUDIO -> modals (Profile, Support chatbot, Google search agent) -> Focus mode. Each in light and dark; viewports e.g. 375 / 768 / 1440.
- Risks: no URLs per screen (state-driven clicks), animations (`motion`) need settle waits / `reducedMotion`, Web Audio autoplay, focus-mode listens to blur/visibility and fullscreen/keyboard-lock APIs (may behave oddly headless), AI-dependent screens need either no key (canned replies) or mocked `/api/*` via `page.route`.
- Recommended: Playwright script outside `src/` (e.g. `redesign/tools/capture.mjs`) writing to `redesign/screenshots/{before,after}/{viewport}-{theme}-{screen}.png`.

## 11. `redesign/reference/` (Figma exports)

**Did not exist** (the `redesign/` folder itself was absent; created now only for this report). Proposed layout:

```
redesign/
  project-context.md
  reference/
    README.md            # Figma file URL, export date, node IDs
    screens/             # full-frame PNG/SVG per screen: login, explorer, chat, sources, artifacts, methods, profile-modal, support-chat, search-agent, focus-mode
    components/          # isolated components/states (button, card, input, nav, modal)
    tokens/              # colors, typography, spacing, radii, shadows (JSON or screenshots of Figma variables)
    assets/              # logos, icons, illustrations (SVG preferred)
  screenshots/
    before/              # automated captures of current app
    after/
```
Naming: `<screen>__<theme>__<viewport>.png` (e.g. `explorer__light__1440.png`) so each reference maps 1:1 to a "before" capture. Export light and dark if both exist in Figma; include a short mapping note (Figma frame -> app screen).

## 12. Conclusions and redesign risks

1. Blank slate on design system -> first step should be defining tokens (Tailwind v4 `@theme` + CSS variables) before touching components.
2. Dual theming (`isDarkMode` ternaries + `dark:`) must be unified or the redesign will be inconsistent in one mode.
3. Giant components with embedded logic; extracting primitives (Button, Card, Modal, Input, Tabs) is likely prerequisite work.
4. No tests -> visual regression via Playwright screenshots is the only safety net; add `data-testid` or role-based selectors when touching components.
5. No router: decide whether the redesign keeps state-based navigation.
6. Constraint: keep `vite.config.ts` HMR logic and `server.ts` API contracts intact.
