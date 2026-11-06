import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { useTheme } from './app/providers/ThemeProvider';
import { LoginScreen } from './components/LoginScreen';
import { LibraryScreen } from './features/library';
import { ChatScreen } from './features/chat';
import { NotebookSources } from './components/NotebookSources';
import { NotebookMethods } from './components/NotebookMethods';
import { SupportAgentChatbot } from './components/SupportAgentChatbot';
import { GoogleSearchAgent } from './components/GoogleSearchAgent';
import { StudentProfileModal } from './components/StudentProfileModal';
import { useAppState } from './app/AppStateContext';
import { NotFound, paths } from './app/routes';
import { TopBar, NotebookLayout } from './app/shell';
import { MaterialsJobsProvider, MaterialsScreen, MaterialViewer } from './features/materials';
import { Sparkles } from 'lucide-react';

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
    sourceNotification,
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
    handleAddSource,
    handleDeleteSource,
    handleToggleSourceForChat,
    handleSelectAllSourcesForChat,
    handleSetAnalysis,
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
    handleOpenGoogleSearch,
    handleSaveSearchSource
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

      {/* Floating Toast Notification for AI Processing */}
      {sourceNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 bg-white text-slate-900 ${
            sourceNotification.type === 'success'
              ? 'border-emerald-300 shadow-emerald-500/10'
              : 'border-indigo-300 shadow-indigo-500/10'
          }`}>
            <span className={`p-2 rounded-xl shrink-0 ${
              sourceNotification.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
            }`}>
              <Sparkles className="w-4 h-4" />
            </span>
            <p className="text-xs font-semibold leading-relaxed text-slate-800">
              {sourceNotification.message}
            </p>
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
            {!isFocusModeActive && activeSegment === 'FUENTES' && (
              <NotebookSources
                notebook={activeNotebook}
                onAddSource={handleAddSource}
                onDeleteSource={handleDeleteSource}
                onToggleSourceForChat={handleToggleSourceForChat}
                onSelectAllSourcesForChat={handleSelectAllSourcesForChat}
                onSetAnalysis={handleSetAnalysis}
                onAskAboutSource={(sourceTitle) => {
                  setChatInitialPrompt(`¿Qué aspectos centrales, definiciones, autores y conclusiones específicas se detallan en la fuente "${sourceTitle}"?`);
                  goToSegment('CHAT');
                }}
                onGoToCreateSummary={() => {
                  setPendingArtifactType('resumen');
                  goToSegment('ARTEFACTOS');
                }}
                onGoToCreateOtherArtifact={() => {
                  setPendingArtifactType('cuestionario');
                  goToSegment('ARTEFACTOS');
                }}
              />
            )}

            {/* 3. SEGMENTO: ARTEFACTOS */}
            {!isFocusModeActive && activeSegment === 'ARTEFACTOS' && (
              <MaterialsScreen />
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
        <GoogleSearchAgent
          isOpen={isSearchAgentOpen}
          onClose={() => setIsSearchAgentOpen(false)}
          activeNotebook={activeNotebook}
          onSaveSourceToNotebook={handleSaveSearchSource}
          initialQuery={searchAgentInitialQuery}
        />
      )}
    </div>
      )}
    </MaterialsJobsProvider>
  );
}
