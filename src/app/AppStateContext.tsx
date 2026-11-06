import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
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
} from '../types';
import {
  INITIAL_FOLDERS,
  INITIAL_NOTEBOOKS,
  INITIAL_USER_STATS,
  INITIAL_STUDENT_PROFILE
} from '../data/initialData';
import { soundManager } from '../services/audioSynthesizer';
import { AppRoute, parseRoute, paths } from './routes';

/**
 * Thin app-state context (roadmap Revision 2, "thin AppStateContext").
 *
 * The state and handlers below were moved out of `App.tsx` unchanged, except:
 * - `currentView`, `activeSegment`, the active notebook (when on a notebook URL)
 *   and the active chat thread are DERIVED FROM THE URL (`parseRoute`).
 * - Every former `setCurrentView` / `setActiveSegment` call now `navigate()`s
 *   to the matching URL, so Back/Forward work.
 * Theme state intentionally stays in `App.tsx` (replaced by the L1
 * ThemeProvider work).
 */
function useAppStateValue() {
  // URL is the source of truth for view / notebook / segment / thread.
  const location = useLocation();
  const navigate = useNavigate();
  const route: AppRoute = parseRoute(location.pathname);
  const routeNotebookId =
    route.kind === 'workspace' || route.kind === 'notebookIndex' ? route.notebookId : null;

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


  // Support Agent AI Modal/Drawer State
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Google Search Agent Live Grounding Modal State
  const [isSearchAgentOpen, setIsSearchAgentOpen] = useState(false);
  const [searchAgentInitialQuery, setSearchAgentInitialQuery] = useState<string | undefined>(undefined);

  // Chat initial prompt and source processing toast state
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const [sourceNotification, setSourceNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Focus mode active state (locks down outside navigation, triggers fullscreen and keyboard lock)
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(false);
  const [focusWarningToast, setFocusWarningToast] = useState<string | null>(null);
  // URL prefix Focus mode is locked to (`/cuadernos/<id>/estudiar`)
  const focusPathRef = useRef<string | null>(null);

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
    goToSegment('ESTUDIO');
    focusPathRef.current = activeNotebook ? paths.notebookSegment(activeNotebook.id, 'ESTUDIO') : null;
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
    focusPathRef.current = null;
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

    // Session gate (T4.2 / A3): the Login screen is rendered at the requested
    // URL, so after "Empezar" the user simply stays there. From `/` the app
    // continues to Mis cuadernos (`App.tsx` redirects `/` → `/cuadernos`).
  };

  const handleLogout = () => {
    sessionStorage.removeItem('focused_auth_user');
    sessionStorage.removeItem('focused_auth_usertype');
    setCurrentUser(null);
    navigate(paths.login());
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
    navigate(paths.notebookSegment(id, 'CHAT')); // Initially opens CHAT!
  };

  // -------------------------------------------------------------
  // URL-DERIVED NAVIGATION STATE
  // -------------------------------------------------------------
  // Notebook named by the URL (null if the URL has none or the id is unknown).
  const routeNotebook = routeNotebookId ? notebooks.find((n) => n.id === routeNotebookId) || null : null;

  // Outside a notebook URL, keep the legacy fallback (last opened notebook, else
  // the first one): the support and search agents still use it from Explorer.
  const activeNotebook =
    routeNotebook || notebooks.find((n) => n.id === activeNotebookId) || notebooks[0] || null;

  // Remember the notebook opened via URL (deep link, Back/Forward).
  useEffect(() => {
    if (routeNotebook) setActiveNotebookId(routeNotebook.id);
  }, [routeNotebook?.id]);

  const currentView: 'explorer' | 'workspace' =
    route.kind === 'workspace' && routeNotebook ? 'workspace' : 'explorer';
  const activeSegment: MainSegment = route.kind === 'workspace' ? route.segment : 'CHAT';

  // Replaces the former `setActiveSegment(segment)`.
  const goToSegment = (segment: MainSegment) => {
    if (!activeNotebook) return;
    // Already in that section (e.g. `/chat/<thread>` or `/estudiar/sesion`): keep the URL.
    if (route.kind === 'workspace' && routeNotebook && route.segment === segment) return;
    navigate(paths.notebookSegment(activeNotebook.id, segment));
  };

  // Replaces the former `setCurrentView('explorer')`.
  const goToNotebooks = () => {
    navigate(paths.notebooks());
  };

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
    navigate(paths.notebookSegment(fullNotebook.id, 'CHAT'));
  };

  const handleDeleteNotebook = (notebookId: string) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== notebookId));
    if (activeNotebookId === notebookId) {
      setActiveNotebookId(null);
    }
    if (routeNotebookId === notebookId) {
      navigate(paths.notebooks(), { replace: true });
    }
  };

  // Undo for delete: puts a removed notebook back (at its previous index).
  const handleRestoreNotebook = (notebook: Notebook, index = 0) => {
    setNotebooks((prev) => {
      if (prev.some((n) => n.id === notebook.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, notebook);
      return next;
    });
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
    // Leave `/materiales/<deletedId>` so it does not turn into Not found.
    if (route.kind === 'workspace' && route.artifactId === artifactId) {
      navigate(paths.notebookSegment(activeNotebook.id, 'ARTEFACTOS'), { replace: true });
    }
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
  // A thread in the URL (`/chat/<threadId>`) wins over the persisted `activeChatThreadId`.
  const routeThreadId = route.kind === 'workspace' ? route.threadId : undefined;
  const currentActiveThreadId = routeThreadId || activeNotebook?.activeChatThreadId || currentThreads[0]?.id || 'thread-default';
  const currentActiveThread = currentThreads.find(t => t.id === currentActiveThreadId) || currentThreads[0];

  // Action: "+ Iniciar chat"
  const handleStartNewChat = () => {
    if (!activeNotebook) return;
    const threads = getNotebookThreads(activeNotebook);
    const newIndex = threads.length + 1;
    const newThreadId = `thread-${Date.now()}`;

    const newThread: ChatThread = {
      id: newThreadId,
      title: `Chat ${newIndex}`,
      createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      // Empty on purpose: the Chat screen shows suggested questions for empty threads.
      messages: []
    };

    const updatedThreads = [...threads, newThread];
    const updatedNotebook: Notebook = {
      ...activeNotebook,
      chatThreads: updatedThreads,
      activeChatThreadId: newThreadId
    };

    handleUpdateActiveNotebook(updatedNotebook);
    navigate(paths.chatThread(activeNotebook.id, newThreadId)); // Always switch to CHAT to see the new conversation
  };

  const handleSelectChatThread = (threadId: string) => {
    if (!activeNotebook) return;
    const updatedNotebook: Notebook = {
      ...activeNotebook,
      activeChatThreadId: threadId
    };
    handleUpdateActiveNotebook(updatedNotebook);
    const target = paths.chatThread(activeNotebook.id, threadId);
    if (location.pathname !== target) navigate(target);
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
      // Leave `/chat/<deletedId>` so it does not turn into Not found.
      if (routeThreadId === threadId && nextActiveId) {
        navigate(paths.chatThread(activeNotebook.id, nextActiveId), { replace: true });
      }
    }
  };

  /**
   * Chat screen deletion (the confirmation lives in the UI, no native dialogs).
   * Deleting the last thread replaces it with a new empty "Chat 1" (UX-30).
   */
  const handleRemoveChatThread = (threadId: string): 'deleted' | 'replaced' => {
    if (!activeNotebook) return 'deleted';
    const threads = getNotebookThreads(activeNotebook);
    const remaining = threads.filter(t => t.id !== threadId);
    let replaced = false;
    let nextThreads = remaining;
    if (remaining.length === 0) {
      replaced = true;
      nextThreads = [
        {
          id: `thread-${Date.now()}`,
          title: 'Chat 1',
          createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          messages: []
        }
      ];
    }
    const deletedWasActive = threadId === currentActiveThreadId;
    const nextActiveId = deletedWasActive ? nextThreads[0].id : currentActiveThreadId;
    handleUpdateActiveNotebook({
      ...activeNotebook,
      chatThreads: nextThreads,
      activeChatThreadId: nextActiveId,
      chatMessages: replaced ? [] : activeNotebook.chatMessages
    });
    // Leave `/chat/<deletedId>` so it does not turn into Not found.
    if (routeThreadId === threadId || (replaced && routeThreadId)) {
      navigate(paths.chatThread(activeNotebook.id, nextActiveId), { replace: true });
    }
    return replaced ? 'replaced' : 'deleted';
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
  // -------------------------------------------------------------
  // ROUTE VALIDATION, ROUTE-OPENED OVERLAYS, FOCUS-MODE LOCK
  // -------------------------------------------------------------
  // Unknown notebook / thread / artifact id in the URL → Not found.
  const isNotFound =
    route.kind === 'notFound' ||
    (routeNotebookId !== null && !routeNotebook) ||
    (route.kind === 'workspace' && !!routeNotebook && (
      (!!route.threadId && !currentThreads.some((t) => t.id === route.threadId)) ||
      (!!route.artifactId && !routeNotebook.artifacts.some((a) => a.id === route.artifactId))
    ));

  // `/ayuda` opens the legacy support panel; `/cuenta/*` opens the legacy profile
  // modal (both over Explorer). Closing them while on that URL goes to Mis cuadernos.
  const isAccountRoute = route.kind === 'perfil' || route.kind === 'preferencias';
  const openSupport = () => setIsSupportOpen(true);
  const closeSupport = () => {
    setIsSupportOpen(false);
    if (route.kind === 'ayuda') goToNotebooks();
  };
  const openProfile = () => setIsProfileModalOpen(true);
  const closeProfile = () => {
    setIsProfileModalOpen(false);
    if (isAccountRoute) goToNotebooks();
  };

  // Focus mode hides all navigation, but the browser Back/Forward buttons now
  // change the URL. Keep the user inside the locked notebook's ESTUDIO section.
  useEffect(() => {
    const lockedPath = focusPathRef.current;
    if (!isFocusModeActive || !lockedPath) return;
    if (location.pathname === lockedPath || location.pathname.startsWith(`${lockedPath}/`)) return;
    navigate(lockedPath, { replace: true });
    soundManager.playTamperWarning();
    setFocusWarningToast('⚠️ Focus mode activo: navegación bloqueada');
    setTimeout(() => setFocusWarningToast(null), 3500);
  }, [isFocusModeActive, location.pathname]);

  return {
    // Navigation (URL-derived)
    route,
    isNotFound,
    currentView,
    activeSegment,
    goToSegment,
    goToNotebooks,
    // Session
    currentUser,
    userType,
    handleLoginSuccess,
    handleLogout,
    handleResetDemoData,
    // Profile
    studentProfile,
    handleUpdateProfile,
    isProfileModalOpen: isProfileModalOpen || isAccountRoute,
    openProfile,
    closeProfile,
    // Overlays / transient UI
    isSupportOpen: isSupportOpen || route.kind === 'ayuda',
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
    // Focus mode
    isFocusModeActive,
    focusWarningToast,
    handleActivateFocusMode,
    handleExitFocusMode,
    // Library
    folders,
    notebooks,
    activeNotebookId,
    activeNotebook,
    handleOpenNotebook,
    handleCreateFolder,
    handleDeleteFolder,
    handleCreateNotebook,
    handleDeleteNotebook,
    handleRestoreNotebook,
    handleMoveNotebook,
    // Notebook content
    handleUpdateActiveNotebook,
    handleAddSource,
    handleDeleteSource,
    handleToggleSourceForChat,
    handleSelectAllSourcesForChat,
    handleSetAnalysis,
    handleAddArtifact,
    handleDeleteArtifact,
    handleUpdateArtifact,
    // Stats
    stats,
    handleUpdateStats,
    // Chat threads
    currentThreads,
    currentActiveThreadId,
    currentActiveThread,
    handleStartNewChat,
    handleSelectChatThread,
    handleDeleteChatThread,
    handleRemoveChatThread,
    handleRenameChatThread,
    handleUpdateThreadMessages,
    // Web search
    handleOpenGoogleSearch,
    handleSaveSearchSource
  };
}

export type AppState = ReturnType<typeof useAppStateValue>;

const AppStateContext = createContext<AppState | null>(null);

/** Must be rendered inside `<BrowserRouter>` (uses `useLocation` / `useNavigate`). */
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const value = useAppStateValue();
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within <AppStateProvider>');
  return ctx;
}
