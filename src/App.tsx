import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { WelcomeScreen } from './features/welcome';
import { ProgressScreen } from './features/progress';
import { HelpScreen } from './features/help';
import { AccountScreen } from './features/account';
import { LibraryScreen } from './features/library';
import { ChatScreen } from './features/chat';
import { SourcesScreen } from './features/sources';
import { StudyScreen, StudySessionProvider } from './features/study';
import { WebSearchDialog } from './features/web-search';
import { useAppState } from './app/AppStateContext';
import { NotFound, paths } from './app/routes';
import { TopBar, NotebookLayout } from './app/shell';
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
    currentUser,
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
    handleDeleteChatThread,
    handleRenameChatThread,
    handleUpdateThreadMessages,
  } = useAppState();

  // Session gate (T4.2 / A3): no session → Bienvenida at ANY URL. The URL is kept,
  // so after "Empezar" the requested screen renders. Reload → Bienvenida again.
  if (!currentUser) {
    return <WelcomeScreen />;
  }

  // `/` with a session → Mis cuadernos.
  if (route.kind === 'login') {
    return <Navigate to={paths.notebooks()} replace />;
  }

  // `/cuadernos/<id>` without section → its chat.
  if (route.kind === 'notebookIndex' && !isNotFound) {
    return <Navigate to={paths.notebookSegment(route.notebookId, 'CHAT')} replace />;
  }

  const viewingMaterial =
    route.kind === 'workspace' && Boolean(route.artifactId) && !isNotFound && !isFocusModeActive;

  return (
    <MaterialsJobsProvider>
      {viewingMaterial && activeNotebook ? (
        <MaterialViewer />
      ) : (
    <div className="min-h-screen font-sans selection:bg-primary selection:text-on-primary flex flex-col bg-page text-strong transition-colors duration-200">
      {/* Global top bar (hides itself in Focus mode) */}
      <TopBar />

      {/* Focus mode warning banner toast */}
      {focusWarningToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-3 rounded-2xl shadow-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100 flex items-center gap-3 font-extrabold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span>{focusWarningToast}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-content w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-[calc(var(--mia-bottom-bar,0px)+2rem)]">
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
      </main>

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
