import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  MainSegment,
  Notebook,
  Folder,
  UserStudyStats,
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
import { useToast } from '../ui/Toast';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { apiFetch, setApiErrorListener } from '../services/api';
import { isLimitReached, isPlanTier, planLimit, type PlanTier } from '../config/plans';

/** Accounts ending in this domain are seed users: they get the demo data on first login. */
const SEED_EMAIL_DOMAIN = '@mia.test';

/** Per-user localStorage keys (shape version v3). The theme key stays global. */
const storageKeys = (uid: string) => ({
  folders: `focused_folders_${uid}_v3`,
  notebooks: `focused_notebooks_${uid}_v3`,
  stats: `focused_user_stats_${uid}_v3`,
  profile: `mia_student_profile_${uid}_v3`
});

const emptyStats = (): UserStudyStats => ({
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
});

const emptyStudentProfile = (name: string): StudentProfile => ({
  id: 'student',
  name,
  degree: '',
  university: '',
  academicTerm: '',
  avatarSeed: name || 'Estudiante'
});

export interface UserProfile {
  plan: PlanTier;
  displayName: string | null;
  avatarUrl: string | null;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

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

  // Authentication: the session comes from Supabase (`onAuthStateChange`).
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const userId = session?.user.id ?? null;
  const userEmail = session?.user.email ?? null;
  const isSeedUser = Boolean(userEmail && userEmail.toLowerCase().endsWith(SEED_EMAIL_DOMAIN));
  const plan: PlanTier = profile?.plan ?? 'free';
  const currentUser: string | null = session
    ? profile?.displayName?.trim() || userEmail?.split('@')[0] || 'Estudiante'
    : null;

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setAuthReady(true);
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Reloads `profiles` (plan + display name) for the signed-in user. */
  const refreshProfile = async () => {
    if (!supabase || !userId) return;
    const { data } = await supabase.from('profiles').select('plan, display_name, avatar_url').eq('id', userId).maybeSingle();
    setProfile({
      plan: isPlanTier(data?.plan) ? data.plan : 'free',
      displayName: data?.display_name ?? null,
      avatarUrl: data?.avatar_url ?? null
    });
  };

  // Avatar: own upload -> provider picture (Google) -> null (initials fallback in <Avatar>).
  const meta = session?.user.user_metadata as Record<string, unknown> | undefined;
  const metaAvatar = [meta?.avatar_url, meta?.picture].find((v): v is string => typeof v === 'string' && v !== '');
  const avatarUrl: string | null = profile?.avatarUrl || metaAvatar || null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    void refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Student Profile state (hydrated per user below)
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(emptyStudentProfile(''));

  const handleUpdateProfile = (updated: StudentProfile) => {
    setStudentProfile(updated);
    if (!userId) return;
    try {
      localStorage.setItem(storageKeys(userId).profile, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Google Search Agent Live Grounding Modal State
  const [isSearchAgentOpen, setIsSearchAgentOpen] = useState(false);
  const [searchAgentInitialQuery, setSearchAgentInitialQuery] = useState<string | undefined>(undefined);

  // "Añadir fuente" dialog (opened from the notebook header or the Fuentes screen)
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const openAddSource = () => setIsAddSourceOpen(true);
  const closeAddSource = () => setIsAddSourceOpen(false);

  // Source analysis tracking: ids currently being analyzed in this session and
  // ids whose last analysis failed (transient, not persisted).
  const [analyzingSourceIds, setAnalyzingSourceIds] = useState<string[]>([]);
  const [failedSourceIds, setFailedSourceIds] = useState<string[]>([]);

  // True while the last notebooks write to localStorage failed (quota, private mode).
  const [persistenceError, setPersistenceError] = useState(false);
  const toast = useToast();
  const persistenceToastShown = useRef(false);

  // One toast for every mapped API error (401 / 403 / 429) raised by `apiFetch`.
  useEffect(() => {
    setApiErrorListener((err) =>
      toast.show({ variant: err.status === 401 ? 'danger' : 'warning', message: err.message, duration: 6000 })
    );
    return () => setApiErrorListener(null);
  }, [toast]);

  // Chat initial prompt
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Focus mode active state (locks down outside navigation and requests fullscreen; no keyboard lock)
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(false);
  const [focusWarningToast, setFocusWarningToast] = useState<string | null>(null);
  // URL prefix Focus mode is locked to (`/cuadernos/<id>/estudiar`)
  const focusPathRef = useRef<string | null>(null);

  // Tab-leave detection lives in features/study (alertdialog + counter).
  // Keys are never intercepted or locked here: Tab/Escape must always work
  // (WCAG 2.2 AA, UX-23).

  /** Resolves to whether the browser actually entered fullscreen. */
  const handleActivateFocusMode = async (): Promise<boolean> => {
    goToSegment('ESTUDIO');
    focusPathRef.current = activeNotebook ? paths.notebookSegment(activeNotebook.id, 'ESTUDIO') : null;
    setIsFocusModeActive(true);
    try {
      if (document.fullscreenElement) return true;
      if (!document.fullscreenEnabled) return false;
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  };

  const handleExitFocusMode = () => {
    setIsFocusModeActive(false);
    focusPathRef.current = null;
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  // Folders & Notebooks state (persisted per user id, hydrated on login)
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  // Id of the user whose data is currently loaded; persistence only writes for that user.
  const [dataOwner, setDataOwner] = useState<string | null>(null);

  // Pending artifact type when navigating from Sources to Artifacts
  const [pendingArtifactType, setPendingArtifactType] = useState<ArtifactType | null>(null);

  // User study statistics
  const [stats, setStats] = useState<UserStudyStats>(emptyStats);

  // Hydrate this user's data (or seed/empty data on first login) when the session user changes.
  useEffect(() => {
    if (!userId) {
      setFolders([]);
      setNotebooks([]);
      setActiveNotebookId(null);
      setStats(emptyStats());
      setStudentProfile(emptyStudentProfile(''));
      setDataOwner(null);
      return;
    }
    const keys = storageKeys(userId);
    const savedNotebooks = readJson<Notebook[]>(keys.notebooks);
    const savedFolders = readJson<Folder[]>(keys.folders);
    const savedStats = readJson<UserStudyStats>(keys.stats);
    const savedProfile = readJson<StudentProfile>(keys.profile);
    const firstLogin = savedNotebooks === null && savedFolders === null;
    const seedDemo = firstLogin && isSeedUser;

    const nextNotebooks = savedNotebooks ?? (seedDemo ? INITIAL_NOTEBOOKS : []);
    setFolders(savedFolders ?? (seedDemo ? INITIAL_FOLDERS : []));
    setNotebooks(nextNotebooks);
    setActiveNotebookId(nextNotebooks[0]?.id ?? null);
    setStats(savedStats ?? (isSeedUser ? INITIAL_USER_STATS : emptyStats()));
    setStudentProfile(
      savedProfile ??
        (isSeedUser
          ? INITIAL_STUDENT_PROFILE
          : emptyStudentProfile(session?.user.user_metadata?.full_name || userEmail?.split('@')[0] || ''))
    );
    setDataOwner(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /** The signed-in user's data is loaded (the UI waits for this before rendering screens). */
  const dataReady = !userId || dataOwner === userId;
  const canPersist = Boolean(userId) && dataOwner === userId;

  useEffect(() => {
    if (!canPersist || !userId) return;
    try {
      localStorage.setItem(storageKeys(userId).notebooks, JSON.stringify(notebooks));
      setPersistenceError(false);
      persistenceToastShown.current = false;
    } catch {
      setPersistenceError(true);
      if (!persistenceToastShown.current) {
        persistenceToastShown.current = true;
        toast.show({
          variant: 'danger',
          message: 'No se pudo guardar en este navegador. Libera espacio eliminando fuentes grandes.',
          duration: 10000
        });
      }
    }
  }, [notebooks, canPersist, userId]);

  useEffect(() => {
    if (!canPersist || !userId) return;
    try {
      localStorage.setItem(storageKeys(userId).folders, JSON.stringify(folders));
    } catch {
      // ignore
    }
  }, [folders, canPersist, userId]);

  useEffect(() => {
    if (!canPersist || !userId) return;
    try {
      localStorage.setItem(storageKeys(userId).stats, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats, canPersist, userId]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate(paths.login());
  };

  /** Simulated checkout: the server validates the tier and updates `profiles.plan`. */
  const handleChangePlan = async (next: PlanTier) => {
    const res = await apiFetch('/api/plan', { method: 'POST', body: JSON.stringify({ plan: next }) });
    if (!res.ok) throw new Error('plan update failed');
    await refreshProfile();
  };

  const handleResetDemoData = () => {
    setFolders(INITIAL_FOLDERS);
    setNotebooks(INITIAL_NOTEBOOKS);
    setActiveNotebookId(INITIAL_NOTEBOOKS[0]?.id || null);
    setStats(INITIAL_USER_STATS);
    setStudentProfile(INITIAL_STUDENT_PROFILE);
    try {
      if (userId) localStorage.removeItem(storageKeys(userId).profile);
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

  // Plan count limits (data lives in localStorage, so they are enforced here, client-side).
  const warnPlanLimit = (message: string) =>
    toast.show({
      variant: 'warning',
      message,
      action: { label: 'Ver planes', onAction: () => navigate(paths.plans()) },
      duration: 8000
    });
  /** True when `folderId` already holds the maximum notebooks of the current plan. */
  const isNotebookLimitReached = (folderId: string | null | undefined) =>
    !!folderId &&
    isLimitReached(planLimit(plan, 'notebooksPerFolder'), notebooks.filter((n) => n.folderId === folderId).length);
  const sourceLimitReached =
    !!activeNotebook && isLimitReached(planLimit(plan, 'sourcesPerNotebook'), activeNotebook.sources.length);

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

  const handleUpdateFolder = (folderId: string, patch: Partial<Pick<Folder, 'name' | 'icon' | 'coverImage'>>) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, ...patch } : f)));
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Eject notebooks in deleted folder so they remain as loose notebooks
    setNotebooks((prev) =>
      prev.map((nb) => (nb.folderId === folderId ? { ...nb, folderId: null } : nb))
    );
  };

  const handleCreateNotebook = (newNb: Partial<Notebook>) => {
    if (isNotebookLimitReached(newNb.folderId)) {
      warnPlanLimit('Llegaste al límite de cuadernos por carpeta de tu plan.');
      return;
    }
    const initialThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'Chat 1',
      createdAt: 'Hoy',
      messages: []
    };

    const fullNotebook: Notebook = {
      id: `nb-${Date.now()}`,
      title: newNb.title || 'Nuevo Cuaderno',
      icon: newNb.icon || 'notebook',
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
    const current = notebooks.find((nb) => nb.id === notebookId);
    if (current?.folderId !== folderId && isNotebookLimitReached(folderId)) {
      warnPlanLimit('Esa carpeta llegó al límite de cuadernos de tu plan.');
      return;
    }
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, folderId } : nb))
    );
  };

  const handleRenameNotebook = (notebookId: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setNotebooks((prev) => prev.map((nb) => (nb.id === notebookId ? { ...nb, title: clean } : nb)));
  };

  // Content mutation inside active notebook
  const handleUpdateActiveNotebook = (updated: Notebook) => {
    setNotebooks((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  // Runs the server-side processing + analysis of one source and merges the result.
  const analyzeSource = async (source: SourceItem, notebook: Notebook) => {
    const targetNotebookId = notebook.id;
    setAnalyzingSourceIds((prev) => (prev.includes(source.id) ? prev : [...prev, source.id]));
    setFailedSourceIds((prev) => prev.filter((id) => id !== source.id));

    let succeeded = false;
    try {
      const res = await apiFetch('/api/process-and-analyze-source', {
        method: 'POST',
        body: JSON.stringify({
          source,
          notebookTitle: notebook.title,
          existingSources: notebook.sources.filter((s) => s.id !== source.id)
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
                sources: nb.sources.map((s) =>
                  s.id === source.id
                    ? { ...data.processedSource, selectedForChat: s.selectedForChat !== false }
                    : s
                ),
                analysis: data.notebookAnalysis || nb.analysis,
                updatedAt: new Date().toLocaleDateString('es-ES')
              };
            })
          );
          succeeded = true;
        }
      }
    } catch (err) {
      console.warn('Auto-analysis error upon source addition', err);
    }

    if (!succeeded) {
      // Keep the source usable (its text is stored) but surface the failure per row.
      setNotebooks((prev) =>
        prev.map((nb) => {
          if (nb.id !== targetNotebookId) return nb;
          return {
            ...nb,
            sources: nb.sources.map((s) => (s.id === source.id ? { ...s, isAnalyzing: false, isProcessed: false } : s))
          };
        })
      );
      setFailedSourceIds((prev) => (prev.includes(source.id) ? prev : [...prev, source.id]));
    }
    setAnalyzingSourceIds((prev) => prev.filter((id) => id !== source.id));
  };

  const handleAddSource = async (source: SourceItem) => {
    if (!activeNotebook) return;
    if (sourceLimitReached) {
      warnPlanLimit('Llegaste al límite de fuentes por cuaderno de tu plan.');
      return;
    }
    const initialSource: SourceItem = {
      ...source,
      selectedForChat: source.selectedForChat !== undefined ? source.selectedForChat : true,
      isAnalyzing: true
    };

    // Add source with analyzing status immediately
    const updatedWithPending: Notebook = {
      ...activeNotebook,
      sources: [initialSource, ...activeNotebook.sources],
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    handleUpdateActiveNotebook(updatedWithPending);

    await analyzeSource(initialSource, activeNotebook);
  };

  const handleRetrySourceAnalysis = async (sourceId: string) => {
    if (!activeNotebook) return;
    const source = activeNotebook.sources.find((s) => s.id === sourceId);
    if (!source) return;
    const pending: SourceItem = { ...source, isAnalyzing: true };
    handleUpdateActiveNotebook({
      ...activeNotebook,
      sources: activeNotebook.sources.map((s) => (s.id === sourceId ? pending : s))
    });
    await analyzeSource(pending, activeNotebook);
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

  // Focus mode hides all navigation, but the browser Back/Forward buttons now
  // change the URL. Keep the user inside the locked notebook's ESTUDIO section.
  useEffect(() => {
    const lockedPath = focusPathRef.current;
    if (!isFocusModeActive || !lockedPath) return;
    if (location.pathname === lockedPath || location.pathname.startsWith(`${lockedPath}/`)) return;
    navigate(lockedPath, { replace: true });
    soundManager.playTamperWarning();
    setFocusWarningToast('Modo blindado activo: no puedes salir de esta sección.');
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
    session,
    authReady,
    dataReady,
    isPasswordRecovery,
    clearPasswordRecovery: () => setIsPasswordRecovery(false),
    currentUser,
    userEmail,
    isSeedUser,
    plan,
    sourceLimitReached,
    isNotebookLimitReached,
    profile,
    avatarUrl,
    refreshProfile,
    handleChangePlan,
    handleLogout,
    handleResetDemoData,
    // Profile
    studentProfile,
    handleUpdateProfile,
    // Overlays / transient UI
    isSearchAgentOpen,
    setIsSearchAgentOpen,
    searchAgentInitialQuery,
    chatInitialPrompt,
    setChatInitialPrompt,
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
    handleUpdateFolder,
    handleDeleteFolder,
    handleCreateNotebook,
    handleDeleteNotebook,
    handleRestoreNotebook,
    handleMoveNotebook,
    handleRenameNotebook,
    // Notebook content
    handleUpdateActiveNotebook,
    handleAddSource,
    handleRetrySourceAnalysis,
    analyzingSourceIds,
    failedSourceIds,
    isAddSourceOpen,
    openAddSource,
    closeAddSource,
    persistenceError,
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
