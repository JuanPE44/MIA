import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { useTheme } from './app/providers/ThemeProvider';
import { LoginScreen } from './components/LoginScreen';
import { LibraryScreen } from './features/library';
import { ChatScreen } from './features/chat';
import { SourcesScreen } from './features/sources';
import { NotebookArtifacts } from './components/NotebookArtifacts';
import { NotebookMethods } from './components/NotebookMethods';
import { SupportAgentChatbot } from './components/SupportAgentChatbot';
import { WebSearchDialog } from './features/web-search';
import { StudentProfileModal } from './components/StudentProfileModal';
import { useAppState } from './app/AppStateContext';
import { NotFound, paths } from './app/routes';
import { TopBar, NotebookLayout } from './app/shell';

export default function App() {
  // App state and handlers live in AppStateContext; view / notebook / segment /
  // thread are derived from the URL there (see src/app/routes.tsx).
  const {
    route,
    isNotFound,
    currentView,
    activeSegment,
    goToSegment,
    goToNotebooks,
    currentUser,
    userType,
    handleLoginSuccess,
    handleLogout,
    handleResetDemoData,
    studentProfile,
    handleUpdateProfile,
    isProfileModalOpen,
    openProfile,
    closeProfile,
    isSupportOpen,
    openSupport,
    closeSupport,
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
    handleAddArtifact,
    handleDeleteArtifact,
    handleUpdateArtifact,
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

  // Theme comes from ThemeProvider; legacy "Blanco/Negro" toggle maps to light/dark.
  const {resolvedTheme, setMode: setThemeMode} = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const handleToggleTheme = (dark: boolean) => setThemeMode(dark ? 'dark' : 'light');

  // Session gate (T4.2 / A3): no session → Login at ANY URL. The URL is kept,
  // so after "Empezar" the requested screen renders. Reload → Login again.
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // `/` with a session → Mis cuadernos.
  if (route.kind === 'login') {
    return <Navigate to={paths.notebooks()} replace />;
  }

  // `/cuadernos/<id>` without section → its chat.
  if (route.kind === 'notebookIndex' && !isNotFound) {
    return <Navigate to={paths.notebookSegment(route.notebookId, 'CHAT')} replace />;
  }

  return (
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

        {currentView === 'explorer' && !isNotFound && (
          <LibraryScreen />
        )}

        {/* VIEW 2: INTERIOR DEL CUADERNO CON SUS 4 SEGMENTOS (CHAT, FUENTES, ARTEFACTOS, ESTUDIO) */}
        {currentView === 'workspace' && activeNotebook && !isNotFound && (
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
              <NotebookArtifacts
                notebook={activeNotebook}
                onAddArtifact={handleAddArtifact}
                onUpdateArtifact={handleUpdateArtifact}
                onDeleteArtifact={handleDeleteArtifact}
                initialArtifactType={pendingArtifactType}
                onClearInitialType={() => setPendingArtifactType(null)}
              />
            )}

            {/* 4. SEGMENTO: ESTUDIO (MÉTODOS DE ESTUDIO ACTIVO & FOCUS MODE) */}
            {(isFocusModeActive || activeSegment === 'ESTUDIO') && (
              <NotebookMethods
                notebook={activeNotebook}
                stats={stats}
                onUpdateStats={handleUpdateStats}
                onGoToArtifacts={() => {
                  if (isFocusModeActive) return;
                  goToSegment('ARTEFACTOS');
                }}
                isFocusModeActive={isFocusModeActive}
                onActivateFocusMode={handleActivateFocusMode}
                onExitFocusMode={handleExitFocusMode}
              />
            )}
          </NotebookLayout>
        )}
      </main>

      {/* Agente de Soporte IA y Reservas Multiturno (hidden in Focus mode) */}
      {!isFocusModeActive && isSupportOpen && (
        <SupportAgentChatbot
          isOpen={isSupportOpen}
          onOpen={openSupport}
          onClose={closeSupport}
          username={currentUser || 'Estudiante'}
          userType={userType}
          currentView={currentView}
          activeNotebook={activeNotebook}
          activeSegment={activeSegment}
          stats={stats}
        />
      )}

      {/* Modal de Perfil de Estudiante, Plan Actual y Estado de Cuenta */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfile}
        profile={studentProfile}
        onUpdateProfile={handleUpdateProfile}
        onResetAllData={handleResetDemoData}
        stats={stats}
        username={currentUser || 'Juan'}
        notebooksCount={notebooks.length}
      />

      {/* Agente de Búsqueda Google en Vivo (Grounding en Tiempo Real con Gemini 3.8 Flash invocado desde el Chat) (hidden in Focus mode) */}
      {!isFocusModeActive && (
        <WebSearchDialog
          open={isSearchAgentOpen}
          onClose={() => setIsSearchAgentOpen(false)}
          initialQuery={searchAgentInitialQuery}
        />
      )}
    </div>
  );
}
