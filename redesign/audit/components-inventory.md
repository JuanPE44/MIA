# Components Inventory

Legend: **[OBS]** observed in browser · **[CODE]** read in source · **[INF]** inferred.
Source: `src/components/*.tsx`, `src/App.tsx`. Counts are from `rg` on the current tree.

## 1. Existing React components (all are screen-level)

| Component | Lines | Role | Key props (callbacks omitted unless relevant) | Local state of note |
|-----------|-------|------|-----------------------------------------------|---------------------|
| `App` | 1146 | state hub, view switching, toasts, focus mode, bottom bar, support FAB | — | user, userType, profile, theme, folders, notebooks, stats, activeNotebookId, currentView, activeSegment, pendingArtifactType, focus mode, modal flags |
| `LoginScreen` | 217 | entry | `onLoginSuccess`, `isDarkMode`, `onToggleTheme` | `isLoading` |
| `Navbar` | 289 | global header + 4 segment tabs | `currentView`, `activeSegment`, `activeNotebook`, `stats`, `username`, `isDarkMode`, handlers | — |
| `NotebooksExplorer` | 814 | folders + notebooks list, create/move/delete, 2 modals, context menu | `folders`, `notebooks`, `userType`, `isDarkMode` | search, modal flags, icon/color pickers, context menu |
| `NotebookChat` | 871 | grounded chat per thread | `notebook`, `activeThread`, `initialPrompt`, nav callbacks | input, loading, per-message comment, chunk inspector, renaming |
| `NotebookSources` | 1188 | source list, analysis, add modal, preview | `notebook`, add/delete/toggle/analysis callbacks | add-modal fields (≈13 states), drag, extracting, preview |
| `NotebookArtifacts` | 1797 | artifact list, config panel, viewer (PDF/interactive), quiz/flashcards/podcast | `notebook`, `initialArtifactType`, add/update/delete | ≈30 states (config, viewer, zoom, quiz, cards, podcast, feedback) |
| `NotebookMethods` | 1363 | ESTUDIO: progress, pomodoro, focus, active recall, flashcards | `notebook`, `stats`, `isFocusModeActive`, focus handlers | ≈18 states (cycle, timers, recall, cards) |
| `WeeklyStudyChart` | 440 | weekly bar chart + daily goal + manual logging (Recharts) | `stats`, `onUpdateStats` | — |
| `SupportAgentChatbot` | 487 | floating support chat + reservation card | `isOpen`, `username`, `currentView`, `activeNotebook`, `stats` | messages, input, minimized |
| `GoogleSearchAgent` | 660 | grounded web search chat, 3 modes | `isOpen`, `activeNotebook`, `initialQuery/Mode`, `onSaveSourceToNotebook` | mode, messages, input |
| `StudentProfileModal` | 372 | profile + plan/account | `profile`, `stats`, `notebooksCount`, reset | tab, form, saved flag |

[CODE]: `Notebook*` and `Navbar` receive `isDarkMode` in only some components (LoginScreen, Navbar, Explorer, Chat, App); the rest rely on `dark:` classes only.

## 2. Reusable UI patterns that exist but are NOT componentized

Each is re-written inline per use. Instance counts are what could be verified; "…" = more than listed.

| Pattern | Where it appears | Evidence |
|---------|------------------|----------|
| **Theme switch** ("Blanco / Negro" segmented control) | `LoginScreen`, `Navbar` | OBS — identical markup in both |
| **Modal / overlay** (`fixed inset-0 z-50 … backdrop-blur`) | Artifacts ×3, Sources ×2, Explorer ×2, Methods ×2, Chat, Search, Profile | CODE (11 containers); no shared component, no focus trap/Escape handling observed (Escape did not close Profile or Search) |
| **Tab / segmented controls** | Navbar segments (4), Study tabs (4), Profile tabs (2), Add-source types (3), Search modes (3), Artifact type picker (8), Quality/Format/Length pickers | OBS |
| **Chat bubble + message list** | `NotebookChat`, `SupportAgentChatbot`, `GoogleSearchAgent` | CODE — three separate implementations (state shapes differ) |
| **Stat chip / pill** (streak 🔥, minutes ⏱) | Navbar, bottom bar, Study tiles | OBS — same numbers in 3 places |
| **Card** | notebook card, folder banner, source card, artifact card, stat tile, reservation card | OBS |
| **Toast** | `App` (source processing; focus warning) | OBS/CODE — 2 hand-written toasts |
| **Icon/emoji picker** | Explorer (`FOLDER_ICONS`, `NOTEBOOK_ICONS`, 12 each) | CODE |
| **Context menu** | Explorer (right-click) | OBS |
| **Empty state** | empty folder, empty thread | OBS |
| **Loading state** (`isLoading`, `isGenerating`, `animate-spin`) | present in 7 component files | CODE — per-component ad-hoc |
| **Copy-to-clipboard with "copied" feedback** | Artifacts, Support, Search | CODE |
| **Confirmation dialog** | Destructive actions use the **browser-native `window.confirm`** at 6 sites: delete chat thread (`App.tsx:672`), delete source (`NotebookSources.tsx:584`), reset demo data (`StudentProfileModal.tsx:263`), delete artifact (`NotebookArtifacts.tsx:662`), delete folder (`NotebooksExplorer.tsx:348`), delete notebook (`NotebooksExplorer.tsx:605`); Focus-exit uses a custom modal in Methods | OBS (folder, source, artifact: native dialog fired) + CODE. *(Corrected on UX audit: the first version wrongly said no confirmation existed.)* |

## 3. Non-visual building blocks

| Item | Location | Use |
|------|----------|-----|
| Domain types | `src/types/index.ts` | shared contract |
| Seed data | `src/data/initialData.ts` | demo user, folders, notebook with 3 sources + 5 artifacts + 2 chat threads |
| `soundManager` | `src/services/audioSynthesizer.ts` | ambient sounds, tamper warning beep, stage alarm |
| Icon set | `lucide-react` | all line icons; emojis used for notebook/folder icons and some labels |
| Charts | `recharts` in `WeeklyStudyChart` | |
| Motion | `motion` dependency; Tailwind `animate-in` utilities in toasts/modals | |
| Image assets | `src/assets/images/*.jpg` (hero, banners, avatar, feature images) | folder banners, profile avatar, login |

## 4. Styling facts relevant to components

- 100 % Tailwind utilities inline; no component classes, no `@apply`, no CSS variables (see `project-context.md` §6–7).
- Two theming mechanisms coexist: `isDarkMode` prop ternaries (Login 15, Navbar 17, Explorer 14, Chat 7, App 4) and `dark:` variants (≈390 uses) [CODE].
- Palette by usage: slate 1403, indigo 544, emerald 244, amber 200, purple 160, rose 122, sky 62 [CODE].
- Accessibility attributes are nearly absent: `aria-*`/`role=` found in 2 files (App 2, Support 1) [CODE]; interactive controls rely on `title` attributes (many Spanish tooltips) [OBS].
- Responsive: mobile 390 px overflows (document 521 px) and tabs clip [OBS].

## 5. Coupling notes that affect any component work

- State lives in `App`; children receive 8–15 props each and call `fetch` directly [CODE].
- `NotebookArtifacts` and `NotebookMethods` each exceed 1,300 lines and mix data, effects and markup [CODE].
- `Navbar` renders segment tabs that live conceptually inside the notebook; it also needs the whole `stats` object [CODE].
- The same data (`stats`) is displayed by Navbar, bottom bar, Study tiles and Profile modal, each reading it independently [CODE].
