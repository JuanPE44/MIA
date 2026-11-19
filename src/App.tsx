import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { AuthScreen, AuthCallback } from './features/auth';
import { PlansScreen } from './features/plans';
import { PageTransition, Spinner } from './ui';
import { ProgressScreen } from './features/progress';
import { HelpScreen } from './features/help';
import { AccountScreen } from './features/account';
import { LibraryScreen } from './features/library';
import { ChatScreen } from './features/chat';
import { SourcesScreen } from './features/sources';
import { StudyScreen, StudySessionProvider } from './features/study';
import { WebSearchDialog } from './features/web-search';
import { OnboardingDialog } from './features/onboarding';
import { useAppState } from './app/AppStateContext';
import { NotFound, paths } from './app/routes';
import { TopBar, SideRail, NotebookLayout } from './app/shell';
import { useToast } from './ui/Toast';
import { MaterialsJobsProvider, MaterialsScreen, MaterialViewer } from './features/materials';

export default function App() {
  // App state and handlers live in AppStateContext; view / notebook / segment /
  // thread are derived from the URL there (see src/app/routes.tsx).
  const {
    route,
    isNotFound,
    activeSegment,
    goToSegment,
    goToNotebooks,
    session,
    authReady,
    dataReady,
    isSearchAgentOpen,
    setIsSearchAgentOpen,
    searchAgentInitialQuery,
    chatInitialPrompt,
    setChatInitialPrompt,
    pendingArtifactType,
    setPendingArtifactType,
    isFocusModeActive,
    focusWarningToast,
    handleActivateFocusMode,
    handleExitFocusMode,
    folders,
    notebooks,
    activeNotebook,
    handleOpenNotebook,
    handleCreateFolder,
    handleDeleteFolder,
    handleCreateNotebook,
    handleDeleteNotebook,
    handleMoveNotebook,
    stats,
    handleUpdateStats,
    currentThreads,
    currentActiveThreadId,
    currentActiveThread,
    handleStartNewChat,
    handleSelectChatThread,
    handleRenameChatThread,
    handleUpdateThreadMessages,
  } = useAppState();

  // Focus-mode warning: same text/duration as before, shown as a warning Toast.
  const toast = useToast();
  useEffect(() => {
    if (focusWarningToast) toast.show({ message: focusWarningToast, variant: 'warning', duration: 3500 });
  }, [focusWarningToast, toast]);

  // OAuth / email-confirmation / recovery landing page: handled before the session gate.
  if (route.kind === 'authCallback') {
    return <AuthCallback />;
  }

  // Session gate: no Supabase session → AuthScreen at ANY URL (the URL is kept,
  // so after signing in the requested screen renders; reload keeps the session).
  if (!authReady || (session && !dataReady)) {
    return (
      <div role="status" aria-label="Cargando" className="flex min-h-screen items-center justify-center bg-page">
        <Spinner />
      </div>
    );
  }
  if (!session) {
    return <AuthScreen />;
  }

  // `/` with a session → Mis cuadernos.
  if (route.kind === 'login') {
    return <Navigate to={paths.notebooks()} replace />;
  }

  // `/cuadernos/<id>` without section → its chat.
  if (route.kind === 'notebookIndex' && !isNotFound) {
    return <Navigate to={paths.notebookSegment(route.notebookId, 'CHAT')} replace />;
  }

  // Top-level screen identity for the route transition (tabs inside a notebook animate in NotebookLayout).
  const screenKey = isNotFound
    ? 'not-found'
    : route.kind === 'workspace' && activeNotebook
      ? `notebook:${activeNotebook.id}`
      : route.kind;

  const viewingMaterial =
    route.kind === 'workspace' && Boolean(route.artifactId) && !isNotFound && !isFocusModeActive;

  return (
    <MaterialsJobsProvider>
      {viewingMaterial && activeNotebook ? (
        <MaterialViewer />
      ) : (
    <div className="min-h-screen font-sans selection:bg-highlight selection:text-highlight-ink text-strong lg:flex">
      {/* First tab stop: jumps over the rail/top bar to the main landmark */}
      <a
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('contenido')?.focus();
        }}
        className="fixed left-3 top-3 z-[100] -translate-y-[200%] rounded-control border border-ink bg-surface px-4 py-2 text-label text-strong transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        Saltar al contenido
      </a>
      {/* Desktop rail (lg+); hides itself in Focus mode */}
      <SideRail />

      <div className="flex min-w-0 flex-1 flex-col">
      {/* Top bar for phone/tablet (< lg); hides itself in Focus mode */}
      <TopBar />

      {/* Main Container */}
      <main id="contenido" tabIndex={-1} className="w-full flex-1 outline-none px-4 sm:px-6 lg:px-12 pt-6 pb-[calc(var(--mia-bottom-bar,0px)+2rem)]">
        <PageTransition transitionKey={screenKey} lift={false}>
        {/* VIEW 1: EXPLORADOR DE CARPETAS Y CUADERNOS SUELTOS (Shown first upon login!) */}
        {isNotFound && <NotFound />}

        {route.kind === 'explorer' && !isNotFound && (
          <LibraryScreen />
        )}

        {/* Account-level pages (inside the shell, no NotebookLayout) */}
        {route.kind === 'progreso' && <ProgressScreen />}
        {route.kind === 'ayuda' && <HelpScreen />}
        {route.kind === 'perfil' && <AccountScreen tab="perfil" />}
        {route.kind === 'preferencias' && <AccountScreen tab="preferencias" />}
        {route.kind === 'planes' && <PlansScreen />}

        {/* VIEW 2: INTERIOR DEL CUADERNO CON SUS 4 SEGMENTOS (CHAT, FUENTES, ARTEFACTOS, ESTUDIO) */}
        {route.kind === 'workspace' && activeNotebook && !isNotFound && (
          <StudySessionProvider key={activeNotebook.id}>
          <NotebookLayout>
            {/* Notebook header + section tabs / bottom bar live in NotebookLayout */}

            {/* 1. SEGMENTO: CHAT (Opened initially upon opening the notebook!) */}
            {!isFocusModeActive && activeSegment === 'CHAT' && currentActiveThread && (
              <ChatScreen />
            )}

            {/* 2. SEGMENTO: FUENTES */}
            {!isFocusModeActive && activeSegment === 'FUENTES' && <SourcesScreen />}

            {/* 3. SEGMENTO: ARTEFACTOS */}
            {!isFocusModeActive && activeSegment === 'ARTEFACTOS' && (
              <MaterialsScreen />
            )}

            {/* 4. SEGMENTO: ESTUDIO (MÉTODOS DE ESTUDIO ACTIVO & FOCUS MODE) */}
            {(isFocusModeActive || activeSegment === 'ESTUDIO') && <StudyScreen />}
          </NotebookLayout>
          </StudySessionProvider>
        )}
        </PageTransition>
      </main>
      </div>

      {/* First-login welcome (new non-seed accounts only) */}
      {!isFocusModeActive && <OnboardingDialog />}

      {/* Agente de Búsqueda Google en Vivo (Grounding en Tiempo Real con Gemini 3.8 Flash invocado desde el Chat) (hidden in Focus mode) */}
      {!isFocusModeActive && (
        <WebSearchDialog
          open={isSearchAgentOpen}
          onClose={() => setIsSearchAgentOpen(false)}
          initialQuery={searchAgentInitialQuery}
        />
      )}
    </div>
      )}
    </MaterialsJobsProvider>
  );
}
