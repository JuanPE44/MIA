import React, { useState, useEffect } from 'react';
import {
  MainSegment,
  Notebook,
  Folder,
  UserStudyStats,
  UserType,
  SourceItem,
  SourceType,
  SourceAnalysis,
  StudyArtifact,
  ChatMessage,
  ChatThread,
  ArtifactType,
  StudentProfile
} from './types';
import {
  INITIAL_FOLDERS,
  INITIAL_NOTEBOOKS,
  INITIAL_USER_STATS,
  INITIAL_STUDENT_PROFILE
} from './data/initialData';
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
import { soundManager } from './services/audioSynthesizer';
import juanAvatar from './assets/images/juan_profile_avatar_1791724553271.jpg';
import { BookOpen, ShieldCheck, AlertCircle, MessageSquare, Plus, Trash2, Sparkles, Layers, Globe, X } from 'lucide-react';

export default function App() {
  // Authentication State: Always starts on the Login Screen
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('frecuente');

  // Student Profile state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('mia_student_profile');
      return saved ? JSON.parse(saved) : INITIAL_STUDENT_PROFILE;
    } catch {
      return INITIAL_STUDENT_PROFILE;
    }
  });

  const handleUpdateProfile = (updated: StudentProfile) => {
    setStudentProfile(updated);
    try {
      localStorage.setItem('mia_student_profile', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Theme comes from ThemeProvider; legacy "Blanco/Negro" toggle maps to light/dark.
  const {resolvedTheme, setMode: setThemeMode} = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const handleToggleTheme = (dark: boolean) => setThemeMode(dark ? 'dark' : 'light');

  // Support Agent AI Modal/Drawer State
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Google Search Agent Live Grounding Modal State
  const [isSearchAgentOpen, setIsSearchAgentOpen] = useState(false);
  const [searchAgentInitialQuery, setSearchAgentInitialQuery] = useState<string | undefined>(undefined);

  // Chat initial prompt and source processing toast state
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const [sourceNotification, setSourceNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Current Screen View:
  // - 'explorer': Shown once logged in! Lists folders and loose notebooks.
  // - 'workspace': Inside a specific notebook, displaying the 4 segments (CHAT, FUENTES, ARTEFACTOS, ESTUDIO)
  const [currentView, setCurrentView] = useState<'explorer' | 'workspace'>('explorer');

  // Focus mode active state (locks down outside navigation, triggers fullscreen and keyboard lock)
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(false);
  const [focusWarningToast, setFocusWarningToast] = useState<string | null>(null);

  // Keyboard and tab switch tamper protection when Focus mode is active
  useEffect(() => {
    if (!isFocusModeActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Alt + Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        soundManager.playTamperWarning();
        setFocusWarningToast('⚠️ Focus mode activo: atajo Alt + Tab bloqueado');
        setTimeout(() => setFocusWarningToast(null), 3500);
        return false;
      }

      // Intercept Windows/Meta key or Win + D
      if (e.metaKey || e.key === 'Meta') {
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          e.stopPropagation();
        }
        soundManager.playTamperWarning();
        setFocusWarningToast('⚠️ Focus mode activo: tecla del sistema bloqueada');
        setTimeout(() => setFocusWarningToast(null), 3500);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        soundManager.playTamperWarning();
        setStats(prev => ({
          ...prev,
          tamperAttemptsBlocked: prev.tamperAttemptsBlocked + 1
        }));
        setFocusWarningToast('⚠️ Focus mode: se detectó un cambio de ventana o pestaña');
        setTimeout(() => setFocusWarningToast(null), 3500);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFocusModeActive]);

  const handleActivateFocusMode = () => {
    setActiveSegment('ESTUDIO');
    setIsFocusModeActive(true);
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      (navigator as any).keyboard?.lock?.(['Tab', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'Escape', 'KeyD']).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleExitFocusMode = () => {
    setIsFocusModeActive(false);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      (navigator as any).keyboard?.unlock?.();
    } catch {
      // ignore
    }
  };

  // Ensure login screen is ALWAYS shown first on refresh/load, and clear legacy cache
  useEffect(() => {
    sessionStorage.removeItem('focused_auth_user');
    try {
      localStorage.removeItem('focused_folders_frecuente');
      localStorage.removeItem('focused_notebooks_frecuente');
    } catch {
      // ignore
    }
  }, []);

  // The 4 Main Segments inside a notebook (opens initially in CHAT)
  const [activeSegment, setActiveSegment] = useState<MainSegment>('CHAT');

  // Folders & Notebooks state (persisted per userType)
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const savedType = sessionStorage.getItem('focused_auth_usertype');
      if (savedType === 'nuevo') return [];
      const saved = localStorage.getItem('focused_folders_frecuente_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_FOLDERS;
  });

  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    try {
      const savedType = sessionStorage.getItem('focused_auth_usertype');
      if (savedType === 'nuevo') return [];
      const saved = localStorage.getItem('focused_notebooks_frecuente_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_NOTEBOOKS;
  });

  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(() => {
    const savedType = sessionStorage.getItem('focused_auth_usertype');
    if (savedType === 'nuevo') return null;
    return INITIAL_NOTEBOOKS[0]?.id || null;
  });

  // Pending artifact type when navigating from Sources to Artifacts
  const [pendingArtifactType, setPendingArtifactType] = useState<ArtifactType | null>(null);

  // User study statistics
  const [stats, setStats] = useState<UserStudyStats>(() => {
    try {
      const savedType = sessionStorage.getItem('focused_auth_usertype');
      if (savedType === 'nuevo') {
        return {
          focusMinutesToday: 0,
          totalFocusHours: 0,
          currentStreakDays: 1,
          xpPoints: 0,
          sessionsCompleted: 0,
          flashcardsMastered: 0,
          tamperAttemptsBlocked: 0,
          weeklyLogs: [
            { day: 'Lun', fullDay: 'Lunes', date: 'Lun', minutes: 0, targetMinutes: 45, sessions: 0 },
            { day: 'Mar', fullDay: 'Martes', date: 'Mar', minutes: 0, targetMinutes: 45, sessions: 0 },
            { day: 'Mié', fullDay: 'Miércoles', date: 'Mié', minutes: 0, targetMinutes: 45, sessions: 0 },
            { day: 'Jue', fullDay: 'Jueves', date: 'Jue', minutes: 0, targetMinutes: 45, sessions: 0 },
            { day: 'Vie', fullDay: 'Viernes', date: 'Vie', minutes: 0, targetMinutes: 45, sessions: 0 },
            { day: 'Sáb', fullDay: 'Sábado', date: 'Sáb', minutes: 0, targetMinutes: 45, sessions: 0 },
            { day: 'Dom', fullDay: 'Domingo (Hoy)', date: 'Hoy', minutes: 0, targetMinutes: 45, sessions: 0 }
          ]
        };
      }
      const saved = localStorage.getItem('focused_user_stats_frecuente');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USER_STATS;
  });

  // Save changes when user is frecuente
  useEffect(() => {
    if (userType === 'frecuente') {
      try {
        localStorage.setItem('focused_notebooks_frecuente_v2', JSON.stringify(notebooks));
      } catch {
        // ignore
      }
    }
  }, [notebooks, userType]);

  useEffect(() => {
    if (userType === 'frecuente') {
      try {
        localStorage.setItem('focused_folders_frecuente_v2', JSON.stringify(folders));
      } catch {
        // ignore
      }
    }
  }, [folders, userType]);

  useEffect(() => {
    if (userType === 'frecuente') {
      try {
        localStorage.setItem('focused_user_stats_frecuente', JSON.stringify(stats));
      } catch {
        // ignore
      }
    }
  }, [stats, userType]);

  // Handle Login with "Usuario nuevo" vs "Usuario frecuente"
  const handleLoginSuccess = (username: string, type: UserType) => {
    sessionStorage.setItem('focused_auth_user', username);
    sessionStorage.setItem('focused_auth_usertype', type);
    setCurrentUser(username);
    setUserType(type);

    if (type === 'nuevo') {
      // Clean slate for new user who has never entered
      setFolders([]);
      setNotebooks([]);
      setActiveNotebookId(null);
      setStats({
        focusMinutesToday: 0,
        totalFocusHours: 0,
        currentStreakDays: 1,
        xpPoints: 0,
        sessionsCompleted: 0,
        flashcardsMastered: 0,
        tamperAttemptsBlocked: 0
      });
    } else {
      // Modeled example data for frequent user
      setFolders(INITIAL_FOLDERS);
      setNotebooks(INITIAL_NOTEBOOKS);
      setActiveNotebookId(INITIAL_NOTEBOOKS[0]?.id || null);
      setStats(INITIAL_USER_STATS);
    }

    // Critical Requirement: Once logged in, show the list of folders and loose notebooks!
    setCurrentView('explorer');
    setActiveSegment('CHAT');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('focused_auth_user');
    sessionStorage.removeItem('focused_auth_usertype');
    setCurrentUser(null);
    setCurrentView('explorer');
  };

  const handleResetDemoData = () => {
    setFolders(INITIAL_FOLDERS);
    setNotebooks(INITIAL_NOTEBOOKS);
    setActiveNotebookId(INITIAL_NOTEBOOKS[0]?.id || null);
    setStats(INITIAL_USER_STATS);
    setStudentProfile(INITIAL_STUDENT_PROFILE);
    try {
      localStorage.removeItem('mia_student_profile');
    } catch {
      // ignore
    }
  };

  // Open a notebook: transitions to the 4 sections, initially opening CHAT!
  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id);
    setActiveSegment('CHAT'); // Initially opens CHAT!
    setCurrentView('workspace');
  };

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId) || notebooks[0] || null;

  // Folder & Notebook Management Handlers
  const handleCreateFolder = (name: string, color: string, icon: string, coverImage?: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      color,
      icon,
      coverImage: coverImage || undefined,
      createdAt: new Date().toLocaleDateString('es-ES')
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Eject notebooks in deleted folder so they remain as loose notebooks
    setNotebooks((prev) =>
      prev.map((nb) => (nb.folderId === folderId ? { ...nb, folderId: null } : nb))
    );
  };

  const handleCreateNotebook = (newNb: Partial<Notebook>) => {
    const initialThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'Chat 1',
      createdAt: 'Hoy',
      messages: []
    };

    const fullNotebook: Notebook = {
      id: `nb-${Date.now()}`,
      title: newNb.title || 'Nuevo Cuaderno',
      icon: newNb.icon || '📘',
      subject: newNb.subject || 'General',
      description: newNb.description || '',
      category: 'emprendimiento',
      color: 'indigo',
      folderId: newNb.folderId || null,
      createdAt: new Date().toLocaleDateString('es-ES'),
      updatedAt: new Date().toLocaleDateString('es-ES'),
      sources: [],
      analysis: null,
      artifacts: [],
      chatMessages: [],
      chatThreads: [initialThread],
      activeChatThreadId: initialThread.id
    };

    setNotebooks((prev) => [fullNotebook, ...prev]);
    setActiveNotebookId(fullNotebook.id);
    setActiveSegment('CHAT');
    setCurrentView('workspace');
  };

  const handleDeleteNotebook = (notebookId: string) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== notebookId));
    if (activeNotebookId === notebookId) {
      setActiveNotebookId(null);
      setCurrentView('explorer');
    }
  };

  // Right-click action: Move into folder or eject (leave loose)
  const handleMoveNotebook = (notebookId: string, folderId: string | null) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, folderId } : nb))
    );
  };

  // Content mutation inside active notebook
  const handleUpdateActiveNotebook = (updated: Notebook) => {
    setNotebooks((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleAddSource = async (source: SourceItem) => {
    if (!activeNotebook) return;
    const initialSource: SourceItem = {
      ...source,
      selectedForChat: source.selectedForChat !== undefined ? source.selectedForChat : true,
      isAnalyzing: true
    };

    const targetNotebookId = activeNotebook.id;

    // Add source with analyzing status immediately
    const updatedWithPending: Notebook = {
      ...activeNotebook,
      sources: [initialSource, ...activeNotebook.sources],
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updatedWithPending);

    setSourceNotification({
      message: `🧠 La IA está procesando y analizando "${source.title}"...`,
      type: 'info'
    });

    try {
      const res = await fetch('/api/process-and-analyze-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: initialSource,
          notebookTitle: activeNotebook.title,
          existingSources: activeNotebook.sources
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.processedSource) {
          setNotebooks((prev) =>
            prev.map((nb) => {
              if (nb.id !== targetNotebookId) return nb;
              return {
                ...nb,
                sources: nb.sources.map((s) => (s.id === source.id ? { ...data.processedSource, selectedForChat: true } : s)),
                analysis: data.notebookAnalysis || nb.analysis,
                updatedAt: new Date().toLocaleDateString('es-ES')
              };
            })
          );
          setSourceNotification({
            message: `✅ Fuente "${source.title}" procesada y analizada por IA. ¡Lista para consultas específicas en el Chat!`,
            type: 'success'
          });
          setTimeout(() => {
            setSourceNotification(null);
          }, 4500);
          return;
        }
      }
    } catch (err) {
      console.warn('Auto-analysis error upon source addition', err);
    }

    // Fallback mark as processed
    setNotebooks((prev) =>
      prev.map((nb) => {
        if (nb.id !== targetNotebookId) return nb;
        return {
          ...nb,
          sources: nb.sources.map((s) => (s.id === source.id ? { ...s, isAnalyzing: false, isProcessed: true } : s))
        };
      })
    );
    setSourceNotification({
      message: `✅ Fuente "${source.title}" agregada al cuaderno.`,
      type: 'success'
    });
    setTimeout(() => {
      setSourceNotification(null);
    }, 3500);
  };

  const handleDeleteSource = (sourceId: string) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      sources: activeNotebook.sources.filter((s) => s.id !== sourceId),
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
  };

  const handleToggleSourceForChat = (sourceId: string) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      sources: activeNotebook.sources.map((s) =>
        s.id === sourceId
          ? { ...s, selectedForChat: s.selectedForChat === false ? true : false }
          : s
      ),
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
  };

  const handleSelectAllSourcesForChat = (selected: boolean) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      sources: activeNotebook.sources.map((s) => ({
        ...s,
        selectedForChat: selected
      })),
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
  };

  const handleSetAnalysis = (analysis: SourceAnalysis) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      analysis,
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
  };

  const handleAddArtifact = (artifact: StudyArtifact) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      artifacts: [artifact, ...activeNotebook.artifacts],
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
    setStats((prev) => ({ ...prev, xpPoints: prev.xpPoints + 50 }));
  };

  const handleDeleteArtifact = (artifactId: string) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      artifacts: activeNotebook.artifacts.filter((a) => a.id !== artifactId),
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
  };

  const handleUpdateArtifact = (artifact: StudyArtifact) => {
    if (!activeNotebook) return;
    const updated: Notebook = {
      ...activeNotebook,
      artifacts: activeNotebook.artifacts.map((a) => (a.id === artifact.id ? artifact : a)),
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updated);
  };

  const handleUpdateStats = (newStats: Partial<UserStudyStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  };

  // -------------------------------------------------------------
  // MULTI-CHAT THREAD MANAGEMENT WITHIN THE NOTEBOOK
  // -------------------------------------------------------------
  const getNotebookThreads = (nb: Notebook): ChatThread[] => {
    if (nb.chatThreads && nb.chatThreads.length > 0) {
      return nb.chatThreads;
    }
    // Fallback if notebook only had flat chatMessages
    return [
      {
        id: 'thread-default',
        title: 'Chat Principal',
        createdAt: 'Hoy',
        messages: nb.chatMessages || []
      }
    ];
  };

  const currentThreads = activeNotebook ? getNotebookThreads(activeNotebook) : [];
  const currentActiveThreadId = activeNotebook?.activeChatThreadId || currentThreads[0]?.id || 'thread-default';
  const currentActiveThread = currentThreads.find(t => t.id === currentActiveThreadId) || currentThreads[0];

  // Action: "+ Iniciar chat"
  const handleStartNewChat = () => {
    if (!activeNotebook) return;
    const threads = getNotebookThreads(activeNotebook);
    const newIndex = threads.length + 1;
    const newThreadId = `thread-${Date.now()}`;

    const greetingMessage: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      sender: 'assistant',
      text: `Nuevo chat iniciado en el cuaderno "${activeNotebook.title}".\n\nEste hilo comparte el 100% de las ${activeNotebook.sources.length} fuentes y ${activeNotebook.artifacts.length} artefactos de este cuaderno. ¿En qué tema o pregunta te gustaría trabajar?`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      sourcesCited: activeNotebook.sources.map(s => s.title)
    };

    const newThread: ChatThread = {
      id: newThreadId,
      title: `Chat ${newIndex}`,
      createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      messages: activeNotebook.sources.length > 0 ? [greetingMessage] : []
    };

    const updatedThreads = [...threads, newThread];
    const updatedNotebook: Notebook = {
      ...activeNotebook,
      chatThreads: updatedThreads,
      activeChatThreadId: newThreadId
    };

    handleUpdateActiveNotebook(updatedNotebook);
    setActiveSegment('CHAT'); // Always switch to CHAT to see the new conversation
  };

  const handleSelectChatThread = (threadId: string) => {
    if (!activeNotebook) return;
    const updatedNotebook: Notebook = {
      ...activeNotebook,
      activeChatThreadId: threadId
    };
    handleUpdateActiveNotebook(updatedNotebook);
    setActiveSegment('CHAT');
  };

  const handleDeleteChatThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeNotebook) return;
    const threads = getNotebookThreads(activeNotebook);
    if (threads.length <= 1) {
      alert('Cada cuaderno debe tener al menos un chat activo.');
      return;
    }

    if (confirm('¿Deseas eliminar este hilo de chat? (Las fuentes y artefactos permanecerán intactos).')) {
      const remainingThreads = threads.filter(t => t.id !== threadId);
      const nextActiveId = remainingThreads[0]?.id;
      const updatedNotebook: Notebook = {
        ...activeNotebook,
        chatThreads: remainingThreads,
        activeChatThreadId: nextActiveId
      };
      handleUpdateActiveNotebook(updatedNotebook);
    }
  };

  const handleRenameChatThread = (threadId: string, newTitle: string) => {
    if (!activeNotebook) return;
    const threads = getNotebookThreads(activeNotebook);
    const updatedThreads = threads.map(t => (t.id === threadId ? { ...t, title: newTitle } : t));
    const updatedNotebook: Notebook = {
      ...activeNotebook,
      chatThreads: updatedThreads
    };
    handleUpdateActiveNotebook(updatedNotebook);
  };

  const handleUpdateThreadMessages = (threadId: string, newMessages: ChatMessage[]) => {
    if (!activeNotebook) return;
    const threads = getNotebookThreads(activeNotebook);
    const updatedThreads = threads.map(t => (t.id === threadId ? { ...t, messages: newMessages } : t));
    const updatedNotebook: Notebook = {
      ...activeNotebook,
      chatThreads: updatedThreads,
      chatMessages: newMessages // Also keep in sync
    };
    handleUpdateActiveNotebook(updatedNotebook);
  };

  const handleOpenGoogleSearch = (query?: string) => {
    setSearchAgentInitialQuery(query);
    setIsSearchAgentOpen(true);
  };

  const handleSaveSearchSource = (sourceData: Partial<SourceItem>) => {
    if (!activeNotebook) return;
    const newSource: SourceItem = {
      id: `src-google-${Date.now()}`,
      type: (sourceData.type as SourceType) || 'link',
      title: sourceData.title || 'Noticia verificada con Google Search',
      content: sourceData.content || '',
      sourceUrl: sourceData.sourceUrl || '',
      uploadDate: new Date().toLocaleDateString('es-ES'),
      wordCount: sourceData.wordCount || 100,
      selectedForChat: true
    };
    handleAddSource(newSource);
  };

  // If not logged in, render LoginScreen with "Usuario nuevo" vs "Usuario frecuente"
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-600 selection:text-white flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navbar (hidden in Focus mode to preserve distraction-free environment) */}
      {!isFocusModeActive && (
        <Navbar
          currentView={currentView}
          onBackToExplorer={() => setCurrentView('explorer')}
          activeSegment={activeSegment}
          onSelectSegment={setActiveSegment}
          activeNotebook={activeNotebook}
          onLogout={handleLogout}
          username={currentUser}
          userType={userType}
          stats={stats}
          onOpenSupport={() => setIsSupportOpen(true)}
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
        {currentView === 'explorer' && (
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
        {currentView === 'workspace' && activeNotebook && (
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
                      onClick={() => setActiveSegment('FUENTES')}
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
                        onClick={() => setActiveSegment('FUENTES')}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-3.5 py-3 rounded-2xl backdrop-blur-xs shadow-xs transition cursor-pointer"
                        title="Ver fuentes cargadas"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{activeNotebook.sources.length} {activeNotebook.sources.length === 1 ? 'fuente' : 'fuentes'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveSegment('FUENTES')}
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
                      onClick={() => setCurrentView('explorer')}
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
                onGoToArtifactsTab={() => setActiveSegment('ARTEFACTOS')}
                onGoToSourcesTab={() => setActiveSegment('FUENTES')}
                onOpenGoogleSearch={handleOpenGoogleSearch}
                onSelectAllSourcesForChat={handleSelectAllSourcesForChat}
                initialPrompt={chatInitialPrompt}
                onClearInitialPrompt={() => setChatInitialPrompt(undefined)}
                onCloseChat={() => setCurrentView('explorer')}
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
                  setActiveSegment('CHAT');
                }}
                onGoToCreateSummary={() => {
                  setPendingArtifactType('resumen');
                  setActiveSegment('ARTEFACTOS');
                }}
                onGoToCreateOtherArtifact={() => {
                  setPendingArtifactType('cuestionario');
                  setActiveSegment('ARTEFACTOS');
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
                  setActiveSegment('ARTEFACTOS');
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
          onOpen={() => setIsSupportOpen(true)}
          onClose={() => setIsSupportOpen(false)}
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
            onClick={() => setIsProfileModalOpen(true)}
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
        onClose={() => setIsProfileModalOpen(false)}
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
