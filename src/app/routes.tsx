import { matchPath, Link } from 'react-router';
import { MainSegment } from '../types';

/**
 * URL map of the app (information-architecture.md §4, decision A7).
 *
 * The URL is the single source of truth for: current view, active notebook,
 * active segment and active chat thread. `parseRoute` turns a pathname into a
 * typed `AppRoute`; `paths` builds URLs for `navigate()`.
 *
 * Strangler phase (D7): every route still renders the legacy UI from `App.tsx`.
 * Matching is done with React Router's `matchPath` (instead of `<Routes>`)
 * because the legacy layout outside the content area (Navbar, support agent,
 * overlays) also needs the parsed params. Switch to `<Routes>` + layout routes
 * when the new shell (L3 TopBar / NotebookLayout) replaces the legacy layout.
 */

export type StudyTab = 'sesion' | 'repaso' | 'tarjetas';

export type AppRoute =
  | { kind: 'login' }
  | { kind: 'explorer' }
  // Account-level pages rendered inside the shell by App.tsx (features/progress|help|account).
  | { kind: 'progreso' }
  | { kind: 'ayuda' }
  | { kind: 'perfil' }
  | { kind: 'preferencias' }
  // `/cuadernos/:notebookId` without section: redirected to its chat.
  | { kind: 'notebookIndex'; notebookId: string }
  | {
      kind: 'workspace';
      notebookId: string;
      segment: MainSegment;
      threadId?: string;
      artifactId?: string;
      studyTab?: StudyTab;
    }
  | { kind: 'notFound' };

export const SEGMENT_SLUGS: Record<MainSegment, string> = {
  CHAT: 'chat',
  FUENTES: 'fuentes',
  ARTEFACTOS: 'materiales',
  ESTUDIO: 'estudiar'
};

const enc = encodeURIComponent;

export const paths = {
  login: () => '/',
  notebooks: () => '/cuadernos',
  notebookSegment: (notebookId: string, segment: MainSegment) =>
    `/cuadernos/${enc(notebookId)}/${SEGMENT_SLUGS[segment]}`,
  chatThread: (notebookId: string, threadId: string) =>
    `/cuadernos/${enc(notebookId)}/chat/${enc(threadId)}`,
  artifact: (notebookId: string, artifactId: string) =>
    `/cuadernos/${enc(notebookId)}/materiales/${enc(artifactId)}`,
  studyTab: (notebookId: string, tab: StudyTab) =>
    `/cuadernos/${enc(notebookId)}/estudiar/${tab}`
};

type Params = Record<string, string | undefined>;

// Ordered route table. First match wins; anything else is `notFound`.
const ROUTE_TABLE: Array<{ pattern: string; toRoute: (p: Params) => AppRoute }> = [
  { pattern: '/', toRoute: () => ({ kind: 'login' }) },
  { pattern: '/cuadernos', toRoute: () => ({ kind: 'explorer' }) },
  { pattern: '/progreso', toRoute: () => ({ kind: 'progreso' }) },
  { pattern: '/ayuda', toRoute: () => ({ kind: 'ayuda' }) },
  { pattern: '/cuenta/perfil', toRoute: () => ({ kind: 'perfil' }) },
  { pattern: '/cuenta/preferencias', toRoute: () => ({ kind: 'preferencias' }) },
  {
    pattern: '/cuadernos/:notebookId',
    toRoute: (p) => ({ kind: 'notebookIndex', notebookId: p.notebookId! })
  },
  {
    pattern: '/cuadernos/:notebookId/chat',
    toRoute: (p) => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'CHAT' })
  },
  {
    pattern: '/cuadernos/:notebookId/chat/:threadId',
    toRoute: (p) => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'CHAT', threadId: p.threadId })
  },
  {
    pattern: '/cuadernos/:notebookId/fuentes',
    toRoute: (p) => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'FUENTES' })
  },
  {
    pattern: '/cuadernos/:notebookId/materiales',
    toRoute: (p) => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'ARTEFACTOS' })
  },
  {
    // Viewer (L7): App renders MaterialViewer when artifactId is set.
    // Unknown ids are Not found in AppStateContext.
    pattern: '/cuadernos/:notebookId/materiales/:artifactId',
    toRoute: (p) => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'ARTEFACTOS', artifactId: p.artifactId })
  },
  {
    pattern: '/cuadernos/:notebookId/estudiar',
    toRoute: (p) => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'ESTUDIO' })
  },
  // Study sub-tabs (L8): `studyTab` is read by features/study/StudyScreen;
  // `/estudiar` without a tab renders `sesion`.
  ...(['sesion', 'repaso', 'tarjetas'] as StudyTab[]).map((tab) => ({
    pattern: `/cuadernos/:notebookId/estudiar/${tab}`,
    toRoute: (p: Params): AppRoute => ({ kind: 'workspace', notebookId: p.notebookId!, segment: 'ESTUDIO', studyTab: tab })
  }))
];

export function parseRoute(pathname: string): AppRoute {
  for (const { pattern, toRoute } of ROUTE_TABLE) {
    const match = matchPath({ path: pattern, end: true }, pathname);
    if (match) return toRoute(match.params);
  }
  return { kind: 'notFound' };
}

/** Minimal 404 (plain markup on purpose; restyled with the new shell). */
export function NotFound() {
  return (
    <div>
      <h1>Esta página no existe</h1>
      <Link to={paths.notebooks()} className="underline">
        Ir a Mis cuadernos
      </Link>
    </div>
  );
}
