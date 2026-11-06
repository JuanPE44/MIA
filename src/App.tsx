import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { useTheme } from './app/providers/ThemeProvider';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { NotebooksExplorer } from './components/NotebooksExplorer';
import { NotebookChat } from './components/NotebookChat';
import { NotebookSources } from './components/NotebookSources';
import { NotebookArtifacts } from './components/NotebookArtifacts';
import { NotebookMethods } from './components/NotebookMethods';
import { SupportAgentChatbot } from './components/SupportAgentChatbot';
import { GoogleSearchAgent } from './components/GoogleSearchAgent';
import { StudentProfileModal } from './components/StudentProfileModal';
import { useAppState } from './app/AppStateContext';
import { NotFound, paths } from './app/routes';
import juanAvatar from './assets/images/juan_profile_avatar_1791724553271.jpg';
import { BookOpen, ShieldCheck, AlertCircle, MessageSquare, Plus, Trash2, Sparkles, Layers, Globe, X } from 'lucide-react';

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

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-600 selection:text-white flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navbar (hidden in Focus mode to preserve distraction-free environment) */}
      {!isFocusModeActive && (
        <Navbar
          currentView={currentView}
          onBackToExplorer={goToNotebooks}
          activeSegment={activeSegment}
          onSelectSegment={goToSegment}
          activeNotebook={activeNotebook}
          onLogout={handleLogout}
          username={currentUser}
          userType={userType}
          stats={stats}
          onOpenSupport={openSupport}
          onOpenSearch={() => handleOpenGoogleSearch()}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />
      )}

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28">
        {/* VIEW 1: EXPLORADOR DE CARPETAS Y CUADERNOS SUELTOS (Shown first upon login!) */}
        {isNotFound && <NotFound />}

        {currentView === 'explorer' && !isNotFound && (
          <NotebooksExplorer
            folders={folders}
            notebooks={notebooks}
            onOpenNotebook={handleOpenNotebook}
            onCreateNotebook={handleCreateNotebook}
            onDeleteNotebook={handleDeleteNotebook}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveNotebook={handleMoveNotebook}
            userType={userType}
            isDarkMode={isDarkMode}
          />
        )}

        {/* VIEW 2: INTERIOR DEL CUADERNO CON SUS 4 SEGMENTOS (CHAT, FUENTES, ARTEFACTOS, ESTUDIO) */}
        {currentView === 'workspace' && activeNotebook && !isNotFound && (
          <div className="space-y-5">
            {/* Active Notebook Banner - Inverted dark background with light text (hidden in Focus mode) */}
            {!isFocusModeActive && (
              <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-950/20 space-y-4 relative overflow-hidden">
                {/* Subtle ambient glow in background */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none p-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">{activeNotebook.icon || '📘'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/15 backdrop-blur-xs">
                          {activeNotebook.subject}
                        </span>
                        <span className="text-xs text-slate-400">Contexto de Estudio Activo</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug tracking-tight mt-0.5">
                        {activeNotebook.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* BOTÓN BIEN GRANDE Y VISTOSO: AÑADIR FUENTES */}
                    <button
                      onClick={() => goToSegment('FUENTES')}
                      className="group flex items-center gap-3 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 border-2 border-emerald-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-emerald-500/20"
                      title="Añadir nuevas fuentes (PDF, Videos, Textos, Enlaces)"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                        <Plus className="w-5 h-5 text-white stroke-[3]" />
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-sm sm:text-base leading-tight tracking-tight">
                          + Añadir Fuentes
                        </span>
                        <span className="block text-[10px] font-bold text-emerald-100 opacity-90 leading-tight">
                          PDF · Videos · Enlaces · Textos
                        </span>
                      </div>
                    </button>

                    {/* Contador / Estado de fuentes */}
                    {activeNotebook.sources.length > 0 ? (
                      <button
                        onClick={() => goToSegment('FUENTES')}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-3.5 py-3 rounded-2xl backdrop-blur-xs shadow-xs transition cursor-pointer"
                        title="Ver fuentes cargadas"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{activeNotebook.sources.length} {activeNotebook.sources.length === 1 ? 'fuente' : 'fuentes'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => goToSegment('FUENTES')}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 px-3.5 py-3 rounded-2xl transition cursor-pointer backdrop-blur-xs shadow-xs"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Sin fuentes cargadas</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* DEBAJO DEL TÍTULO: LISTADO DE CHATS ACTIVOS & BOTÓN "+ INICIAR CHAT" */}
                <div className="pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5 mr-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Chats Activos:</span>
                    </span>

                    {currentThreads.map((thread) => {
                      const isThreadActive = thread.id === currentActiveThreadId;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectChatThread(thread.id)}
                          className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            isThreadActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                              : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10'
                          }`}
                        >
                          <span>{thread.title}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isThreadActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {thread.messages.length}
                          </span>

                          {currentThreads.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteChatThread(thread.id, e)}
                              className={`p-0.5 rounded hover:bg-rose-500/20 transition ${
                                isThreadActive ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-rose-400'
                              }`}
                              title="Eliminar este hilo de chat"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">
                      (Todos los chats comparten las fuentes y artefactos del cuaderno)
                    </span>

                    {/* Prominent button "+ Iniciar chat" */}
                    <button
                      onClick={handleStartNewChat}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black transition cursor-pointer shadow-md shadow-indigo-600/25"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Iniciar chat</span>
                    </button>

                    {/* Salir del chat y volver al explorador de carpetas */}
                    <button
                      onClick={goToNotebooks}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-200 hover:text-white border border-white/15 hover:border-rose-400/40 text-xs font-bold transition cursor-pointer"
                      title="Salir del chat y volver a las carpetas"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                      <span>Salir</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1. SEGMENTO: CHAT (Opened initially upon opening the notebook!) */}
            {!isFocusModeActive && activeSegment === 'CHAT' && currentActiveThread && (
              <NotebookChat
                notebook={activeNotebook}
                activeThread={currentActiveThread}
                onUpdateThreadMessages={handleUpdateThreadMessages}
                onRenameThread={handleRenameChatThread}
                onStartNewChat={handleStartNewChat}
                onGoToArtifactsTab={() => goToSegment('ARTEFACTOS')}
                onGoToSourcesTab={() => goToSegment('FUENTES')}
                onOpenGoogleSearch={handleOpenGoogleSearch}
                onSelectAllSourcesForChat={handleSelectAllSourcesForChat}
                initialPrompt={chatInitialPrompt}
                onClearInitialPrompt={() => setChatInitialPrompt(undefined)}
                onCloseChat={goToNotebooks}
                isDarkMode={isDarkMode}
              />
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
          </div>
        )}
      </main>

      {/* Footer (hidden in Focus mode) */}
      {!isFocusModeActive && (
        <footer className={`border-t py-6 text-center text-xs mt-12 transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
        }`}>
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_8.03.54_AM_cb87d5b4.jpeg"
                alt="Logo"
                className="w-8 h-8 object-cover rounded-xl shadow-xs border border-slate-300/40 dark:border-slate-700"
              />
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Mi Inteligencia Artificial
              </span>
            </div>

            <div className="flex items-center gap-2 font-bold text-[11px] text-slate-400">
              <span>FUENTES</span>
              <span>→</span>
              <span>ANÁLISIS</span>
              <span>→</span>
              <span>ARTEFACTOS</span>
              <span>→</span>
              <span>ESTUDIO ACTIVO</span>
            </div>
          </div>
        </footer>
      )}

      {/* Agente de Soporte IA y Reservas Multiturno (hidden in Focus mode) */}
      {!isFocusModeActive && (
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

      {/* BARRA HORIZONTAL EN LA PARTE INFERIOR (VISIBLE AL INGRESAR EL USUARIO) */}
      {!isFocusModeActive && currentUser && (
        <div
          role="region"
          aria-label="Barra inferior de usuario y perfil"
          className={`fixed bottom-0 left-0 right-0 z-30 px-4 sm:px-8 py-2.5 border-t backdrop-blur-md transition-colors ${
            isDarkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
          } shadow-xl flex items-center justify-between`}
        >
          {/* Botón rectangular con foto de perfil y 'PERFIL' en grande y en mayúsculas */}
          <button
            type="button"
            onClick={openProfile}
            className="flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 transition-all cursor-pointer shadow-xs active:scale-98 group"
            title="Abrir perfil: consulta tu plan actual y el estado de tu cuenta"
          >
            <img
              src={juanAvatar}
              alt="Foto de perfil de Juan"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-indigo-500 shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="text-left">
              <span className="block text-base sm:text-lg font-black tracking-wider text-slate-900 dark:text-white uppercase leading-none">
                PERFIL
              </span>
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Plan Pro &bull; Estado de Cuenta
              </span>
            </div>
          </button>

          {/* Resumen de estado de cuenta e indicadores rápidos */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Plan Actual
              </span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                Plan Universitario Pro
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-black">
              <span>🔥 {stats.currentStreakDays} {stats.currentStreakDays === 1 ? 'día' : 'días'}</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
              <span>⏱️ {stats.focusMinutesToday}m / 60m hoy</span>
            </div>
          </div>
        </div>
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
  );
}
