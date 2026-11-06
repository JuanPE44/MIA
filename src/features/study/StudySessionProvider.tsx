import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {useLocation} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {soundManager} from '../../services/audioSynthesizer';
import {useToast} from '../../ui';
import {
  createSession,
  currentStage,
  DEFAULT_CONFIG,
  isActive,
  sessionReducer,
  type SessionAction,
  type SessionConfig,
  type SessionState,
} from './sessionMachine';

export interface SessionSummaryData {
  minutes: number;
  blocks: number;
  tabLeaves: number;
}

export interface StudySettings {
  studyMinutes: 20 | 25 | 30;
  longBreakMinutes: 15 | 20 | 25 | 30;
  blindado: boolean;
}

interface StudySessionApi {
  settings: StudySettings;
  setSettings: (next: StudySettings) => void;
  session: SessionState | null;
  summary: SessionSummaryData | null;
  /** Times the student left the tab while Modo blindado was on. */
  tabLeaves: number;
  tabLeftOpen: boolean;
  dismissTabLeft: () => void;
  fullscreenUnsupported: boolean;
  /** Polite live-region text for stage changes. */
  announcement: string;
  blindadoOn: boolean;
  debug: boolean;
  start: () => void;
  dispatch: (action: SessionAction) => void;
  finish: () => void;
  exitBlindado: () => void;
  clearSummary: () => void;
  masteredCardIds: ReadonlySet<string>;
  markCardMastered: (id: string) => boolean;
}

const StudySessionContext = createContext<StudySessionApi | null>(null);

export function useStudySession(): StudySessionApi {
  const ctx = useContext(StudySessionContext);
  if (!ctx) throw new Error('useStudySession must be used inside <StudySessionProvider>');
  return ctx;
}

const SHORT_BREAK_MINUTES = 5;

function debugRequested(search: string): boolean {
  return import.meta.env.DEV && new URLSearchParams(search).has('debug');
}

/**
 * Owns the running study session so it survives switching between the study
 * tabs and notebook sections. Drives the clock, stats/XP updates, sounds,
 * Modo blindado (focus mode + tab-leave detection) and the `beforeunload`
 * confirmation. Mount it once per notebook.
 */
export function StudySessionProvider({children}: {children: ReactNode}) {
  const {stats, handleUpdateStats, isFocusModeActive, handleActivateFocusMode, handleExitFocusMode} = useAppState();
  const toast = useToast();
  const location = useLocation();

  const [settings, setSettings] = useState<StudySettings>({studyMinutes: 25, longBreakMinutes: 20, blindado: true});
  const [session, setSession] = useState<SessionState | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [tabLeaves, setTabLeaves] = useState(0);
  const [tabLeftOpen, setTabLeftOpen] = useState(false);
  const [fullscreenUnsupported, setFullscreenUnsupported] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [masteredCardIds, setMasteredCardIds] = useState<ReadonlySet<string>>(new Set());
  // Latch `?debug` so Modo blindado navigation (which drops the query) does not hide the controls.
  const [debug, setDebug] = useState(() => debugRequested(window.location.search));

  // Latest values for async callbacks and listeners.
  const latest = useRef({stats, handleUpdateStats, isFocusModeActive, handleExitFocusMode, toast});
  latest.current = {stats, handleUpdateStats, isFocusModeActive, handleExitFocusMode, toast};
  const handledSeq = useRef(0);
  const tabLeavesRef = useRef(0);

  const active = session !== null && isActive(session);
  const running = session?.status === 'running';
  const blindadoOn = isFocusModeActive;

  useEffect(() => {
    if (debugRequested(location.search)) setDebug(true);
  }, [location.search]);

  const patchStats = useCallback((patch: (s: typeof stats) => Partial<typeof stats>) => {
    const {stats: current, handleUpdateStats: update} = latest.current;
    const next = patch(current);
    // Keep the ref fresh so two updates in the same tick do not clobber each other.
    latest.current.stats = {...current, ...next};
    update(next);
  }, []);

  const dispatch = useCallback((action: SessionAction) => {
    setSession((prev) => (prev ? sessionReducer(prev, action) : prev));
  }, []);

  const start = useCallback(() => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      studyMinutes: settings.studyMinutes,
      shortBreakMinutes: SHORT_BREAK_MINUTES,
      longBreakMinutes: settings.longBreakMinutes,
    };
    handledSeq.current = 0;
    tabLeavesRef.current = 0;
    setTabLeaves(0);
    setTabLeftOpen(false);
    setSummary(null);
    setFullscreenUnsupported(false);
    setAnnouncement(`Estudio, 1 de ${config.cycles}.`);
    setSession(createSession(config));
    if (settings.blindado) {
      void handleActivateFocusMode().then((ok) => setFullscreenUnsupported(!ok));
    }
  }, [settings, handleActivateFocusMode]);

  const finish = useCallback(() => dispatch({type: 'finish'}), [dispatch]);

  const exitBlindado = useCallback(() => {
    latest.current.handleExitFocusMode();
    setFullscreenUnsupported(false);
    latest.current.toast.show({message: 'Saliste del modo blindado. La sesión sigue en marcha.', variant: 'info'});
  }, []);

  const masteredRef = useRef<Set<string>>(new Set());
  const markCardMastered = useCallback((id: string) => {
    if (masteredRef.current.has(id)) return false;
    masteredRef.current.add(id);
    setMasteredCardIds(new Set(masteredRef.current));
    return true;
  }, []);

  // Clock. Elapsed time is measured with timestamps, so a throttled background
  // tab still catches up when it becomes visible again.
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - last) / 1000);
      if (elapsed < 1) return;
      last += elapsed * 1000;
      dispatch({type: 'tick', seconds: elapsed});
    }, 500);
    return () => window.clearInterval(id);
  }, [running, dispatch]);

  // Stage completed: alarm, toast, stats, live-region announcement. Once per `seq`.
  useEffect(() => {
    const done = session?.lastCompleted;
    if (!session || !done || done.seq === handledSeq.current) return;
    handledSeq.current = done.seq;
    soundManager.playStageAlarm();
    if (done.type === 'study') {
      const minutes = done.creditedMinutes;
      patchStats((s) => ({
        focusMinutesToday: s.focusMinutesToday + minutes,
        totalFocusHours: Math.round((s.totalFocusHours + minutes / 60) * 10) / 10,
        sessionsCompleted: s.sessionsCompleted + 1,
        xpPoints: s.xpPoints + 60,
      }));
    }
    latest.current.toast.show({
      message: done.type === 'study' ? '¡Bloque completo! Te toca descansar.' : 'Descanso terminado.',
      variant: 'success',
    });
    if (session.status === 'between') {
      const next = currentStage(session);
      const label =
        next.type === 'study'
          ? `Estudio, ${next.block} de ${session.config.cycles}`
          : next.type === 'short'
            ? 'Descanso corto'
            : 'Descanso largo';
      setAnnouncement(`Etapa completa. Siguiente: ${label}, ${next.minutes} minutos. Pulsa para empezar.`);
    } else if (session.status === 'finished') {
      const doneLabel = done.type === 'study' ? 'Bloque de estudio' : done.type === 'short' ? 'Descanso corto' : 'Descanso largo';
      setAnnouncement(`${doneLabel} completo.`);
    }
  }, [session, patchStats]);

  // Session over (completed or ended by the student): summary, leave Modo blindado.
  useEffect(() => {
    if (!session || session.status !== 'finished') return;
    setSummary({
      minutes: session.creditedMinutes,
      blocks: session.completedStudyBlocks,
      tabLeaves: tabLeavesRef.current,
    });
    setSession(null);
    setTabLeftOpen(false);
    if (latest.current.isFocusModeActive) latest.current.handleExitFocusMode();
  }, [session]);

  // Leaving the page during a session asks for confirmation (reload is not restored).
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);

  // Modo blindado: warn (sound + counter + alertdialog on return) when the tab is left.
  // Covers pause and the wait between stages, not only the running clock.
  useEffect(() => {
    if (!active || !isFocusModeActive) return;
    const onVisibility = () => {
      if (!document.hidden) return;
      soundManager.playTamperWarning();
      tabLeavesRef.current += 1;
      setTabLeaves(tabLeavesRef.current);
      setTabLeftOpen(true);
      patchStats((s) => ({tamperAttemptsBlocked: s.tamperAttemptsBlocked + 1}));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [active, isFocusModeActive, patchStats]);

  // Never leave the app stuck in focus mode if the provider goes away.
  useEffect(
    () => () => {
      if (latest.current.isFocusModeActive) latest.current.handleExitFocusMode();
    },
    [],
  );

  const value = useMemo<StudySessionApi>(
    () => ({
      settings,
      setSettings,
      session,
      summary,
      tabLeaves,
      tabLeftOpen,
      dismissTabLeft: () => setTabLeftOpen(false),
      fullscreenUnsupported,
      announcement,
      blindadoOn,
      debug,
      start,
      dispatch,
      finish,
      exitBlindado,
      clearSummary: () => setSummary(null),
      masteredCardIds,
      markCardMastered,
    }),
    [
      settings, session, summary, tabLeaves, tabLeftOpen, fullscreenUnsupported, announcement,
      blindadoOn, debug, start, dispatch, finish, exitBlindado, masteredCardIds, markCardMastered,
    ],
  );

  return (
    <StudySessionContext.Provider value={value}>
      {children}
      {/* Stage changes only — the countdown is a timer, not a live region. */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </StudySessionContext.Provider>
  );
}
