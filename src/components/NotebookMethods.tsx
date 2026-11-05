import React, { useState, useEffect } from 'react';
import {
  Clock,
  Brain,
  Layers,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Shield,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Eye,
  Award,
  Flame,
  ArrowRight,
  BarChart3,
  LogOut,
  AlertTriangle,
  Zap,
  FastForward,
  Target,
  Check,
  Coffee,
  Bell,
  Settings2,
  ChevronRight,
  X
} from 'lucide-react';
import { Notebook, UserStudyStats } from '../types';
import { soundManager } from '../services/audioSynthesizer';
import { WeeklyStudyChart } from './WeeklyStudyChart';

interface NotebookMethodsProps {
  notebook: Notebook;
  stats: UserStudyStats;
  onUpdateStats: (newStats: Partial<UserStudyStats>) => void;
  onGoToArtifacts: () => void;
  isFocusModeActive?: boolean;
  onActivateFocusMode?: () => void;
  onExitFocusMode?: () => void;
}

// Definition of each stage in a complete 8-step Pomodoro cycle
interface PomodoroCycleStage {
  id: number;
  type: 'study' | 'short_break' | 'long_break';
  label: string;
  shortLabel: string;
  sessionNumber?: number; // 1 to 4
  breakNumber?: number; // 1 to 3
  durationMinutes: number;
}

export const NotebookMethods: React.FC<NotebookMethodsProps> = ({
  notebook,
  stats,
  onUpdateStats,
  onGoToArtifacts,
  isFocusModeActive = false,
  onActivateFocusMode,
  onExitFocusMode
}) => {
  const [activeMethodTab, setActiveMethodTab] = useState<'progreso' | 'pomodoro' | 'active_recall' | 'flashcards'>('progreso');

  // Cycle Configuration State (Allows user to configure before starting)
  const [isCycleStarted, setIsCycleStarted] = useState<boolean>(false);
  const [studyDurationSetting, setStudyDurationSetting] = useState<20 | 25 | 30>(25);
  const [shortBreakDurationSetting] = useState<5>(5); // Fixed at 5 minutes
  const [longBreakDurationSetting, setLongBreakDurationSetting] = useState<15 | 20 | 25 | 30>(20);

  // Current stage in the 8-stage cycle (0: Study 1, 1: Break 1, 2: Study 2, 3: Break 2, 4: Study 3, 5: Break 3, 6: Study 4, 7: Long Break)
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);

  // Build current cycle stages dynamically based on settings
  const cycleStages: PomodoroCycleStage[] = [
    { id: 0, type: 'study', label: 'Sesión de Estudio 1', shortLabel: 'Estudio 1', sessionNumber: 1, durationMinutes: studyDurationSetting },
    { id: 1, type: 'short_break', label: 'Descanso Corto 1', shortLabel: 'Descanso 1', breakNumber: 1, durationMinutes: shortBreakDurationSetting },
    { id: 2, type: 'study', label: 'Sesión de Estudio 2', shortLabel: 'Estudio 2', sessionNumber: 2, durationMinutes: studyDurationSetting },
    { id: 3, type: 'short_break', label: 'Descanso Corto 2', shortLabel: 'Descanso 2', breakNumber: 2, durationMinutes: shortBreakDurationSetting },
    { id: 4, type: 'study', label: 'Sesión de Estudio 3', shortLabel: 'Estudio 3', sessionNumber: 3, durationMinutes: studyDurationSetting },
    { id: 5, type: 'short_break', label: 'Descanso Corto 3', shortLabel: 'Descanso 3', breakNumber: 3, durationMinutes: shortBreakDurationSetting },
    { id: 6, type: 'study', label: 'Sesión de Estudio 4', shortLabel: 'Estudio 4', sessionNumber: 4, durationMinutes: studyDurationSetting },
    { id: 7, type: 'long_break', label: 'Descanso Largo Final', shortLabel: 'Descanso Largo', durationMinutes: longBreakDurationSetting }
  ];

  const currentStage = cycleStages[currentStageIndex] || cycleStages[0];
  const isBreakMode = currentStage.type !== 'study';

  // Pomodoro timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Bottom-Right Pop-up notification when timer finishes
  const [stageEndNotice, setStageEndNotice] = useState<{
    finishedStageLabel: string;
    nextStageLabel: string;
    nextStageDuration: number;
    nextStageType: 'study' | 'short_break' | 'long_break';
  } | null>(null);

  // Modals for Focus mode
  const [isFocusWarningModalOpen, setIsFocusWarningModalOpen] = useState(false);
  const [isExitConfirmModalOpen, setIsExitConfirmModalOpen] = useState(false);

  // Test mode: 1s = 1m
  const [isTestModeSpeed, setIsTestModeSpeed] = useState(false);

  // Active Recall state
  const [recallChallenge, setRecallChallenge] = useState<{
    challengeQuestion: string;
    expectedKeyPoints: string[];
    canonicalAnswer: string;
    sourceReference: string;
  } | null>(null);
  const [isLoadingRecall, setIsLoadingRecall] = useState(false);
  const [userRecallAnswer, setUserRecallAnswer] = useState('');
  const [showCanonicalAnswer, setShowCanonicalAnswer] = useState(false);

  // Active Break mini question
  const [breakAnswerRevealed, setBreakAnswerRevealed] = useState(false);

  // Flashcards from artifacts
  const flashcardArtifact = notebook.artifacts.find((a) => a.type === 'flashcards');
  const flashcardsList = flashcardArtifact?.structuredData && Array.isArray(flashcardArtifact.structuredData)
    ? flashcardArtifact.structuredData
    : [];

  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredFlashcardIds, setMasteredFlashcardIds] = useState<Record<string, boolean>>({});

  // When cycle starts or stage changes, update timer duration if timer not running
  const handleStartCycle = () => {
    setIsCycleStarted(true);
    setCurrentStageIndex(0);
    setTimerSeconds(studyDurationSetting * 60);
    setIsTimerRunning(false);
  };

  const handleResetCycle = () => {
    setIsTimerRunning(false);
    setIsCycleStarted(false);
    setCurrentStageIndex(0);
    setTimerSeconds(studyDurationSetting * 60);
    setStageEndNotice(null);
  };

  // Trigger stage completion: alarms, pops up notification at bottom-right, and queues next stage (manual activation)
  const handleCompleteCurrentStage = () => {
    // 1. Play audible stage alarm chime
    soundManager.playStageAlarm();

    // 2. Stop running timer (timers are not automatic!)
    setIsTimerRunning(false);

    const finished = currentStage;

    // 3. Award stats if a study session was completed
    if (finished.type === 'study') {
      onUpdateStats({
        sessionsCompleted: stats.sessionsCompleted + 1,
        xpPoints: stats.xpPoints + 60
      });
    }

    // 4. Calculate next stage in 8-step cycle
    const nextIndex = (currentStageIndex + 1) % 8;
    const next = cycleStages[nextIndex];

    setCurrentStageIndex(nextIndex);
    setTimerSeconds(next.durationMinutes * 60);
    setBreakAnswerRevealed(false);

    // 5. Trigger bottom-right pop-up notification
    setStageEndNotice({
      finishedStageLabel: finished.label,
      nextStageLabel: next.label,
      nextStageDuration: next.durationMinutes,
      nextStageType: next.type
    });
  };

  // Pomodoro interval loop: tracks effective study minutes in real-time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        if (isTestModeSpeed) {
          // Accelerated test mode: 1 second counts as 1 full minute!
          setTimerSeconds((prev) => {
            const next = Math.max(0, prev - 60);
            if (currentStage.type === 'study') {
              onUpdateStats({
                focusMinutesToday: stats.focusMinutesToday + 1,
                totalFocusHours: Math.round((stats.totalFocusHours + 1 / 60) * 10) / 10
              });
            }
            return next;
          });
        } else {
          // Standard real-time
          setTimerSeconds((prev) => {
            const next = prev - 1;
            // Every 60 seconds elapsed in a study session, count 1 effective study minute!
            const totalStageSec = currentStage.durationMinutes * 60;
            if (currentStage.type === 'study' && (totalStageSec - next) > 0 && (totalStageSec - next) % 60 === 0) {
              onUpdateStats({
                focusMinutesToday: stats.focusMinutesToday + 1,
                totalFocusHours: Math.round((stats.totalFocusHours + 1 / 60) * 10) / 10
              });
            }
            return next;
          });
        }
      }, 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      handleCompleteCurrentStage();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isTimerRunning,
    timerSeconds,
    currentStage,
    currentStageIndex,
    isTestModeSpeed,
    stats.focusMinutesToday,
    stats.totalFocusHours,
    stats.sessionsCompleted,
    stats.xpPoints
  ]);

  // Tab switch tamper protection when Focus mode is active
  useEffect(() => {
    if (!isFocusModeActive || !isTimerRunning) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        soundManager.playTamperWarning();
        onUpdateStats({
          tamperAttemptsBlocked: stats.tamperAttemptsBlocked + 1
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFocusModeActive, isTimerRunning, stats.tamperAttemptsBlocked]);

  const toggleTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      setStageEndNotice(null);
    } else {
      setIsTimerRunning(false);
    }
  };

  const resetCurrentTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(currentStage.durationMinutes * 60);
  };

  // Test mode handlers: advance 1 minute, 10 minutes, or instantly finish current stage
  const handleAddOneMinuteTest = () => {
    if (timerSeconds <= 60) {
      handleCompleteCurrentStage();
      return;
    }
    setTimerSeconds((prev) => Math.max(0, prev - 60));
    if (currentStage.type === 'study') {
      onUpdateStats({
        focusMinutesToday: stats.focusMinutesToday + 1,
        totalFocusHours: Math.round((stats.totalFocusHours + 1 / 60) * 10) / 10
      });
    }
  };

  const handleAddTenMinutesTest = () => {
    if (timerSeconds <= 600) {
      handleCompleteCurrentStage();
      return;
    }
    setTimerSeconds((prev) => Math.max(0, prev - 600));
    if (currentStage.type === 'study') {
      onUpdateStats({
        focusMinutesToday: stats.focusMinutesToday + 10,
        totalFocusHours: Math.round((stats.totalFocusHours + 10 / 60) * 10) / 10
      });
    }
  };

  // Focus mode activation trigger
  const handleRequestFocusMode = () => {
    if (isFocusModeActive) {
      setIsExitConfirmModalOpen(true);
    } else {
      setIsFocusWarningModalOpen(true);
    }
  };

  const handleConfirmActivateFocus = () => {
    setIsFocusWarningModalOpen(false);
    if (onActivateFocusMode) {
      onActivateFocusMode();
    }
    if (!isCycleStarted) {
      handleStartCycle();
    }
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }
  };

  const handleConfirmExitFocus = () => {
    setIsExitConfirmModalOpen(false);
    setIsTimerRunning(false);
    if (onExitFocusMode) {
      onExitFocusMode();
    }
  };

  const handleFetchActiveRecall = async () => {
    if (notebook.sources.length === 0) {
      alert('Se requiere al menos una fuente cargada en el cuaderno para generar preguntas de Active Recall.');
      return;
    }

    setIsLoadingRecall(true);
    setShowCanonicalAnswer(false);
    setUserRecallAnswer('');

    try {
      const res = await fetch('/api/active-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: notebook.sources,
          notebookTitle: notebook.title
        })
      });

      if (!res.ok) throw new Error('Error al generar Active Recall');
      const data = await res.json();
      setRecallChallenge(data.challenge);
    } catch {
      const s0 = notebook.sources[0];
      const sentences = (s0?.content || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
      setRecallChallenge({
        challengeQuestion: `Sin mirar el texto de "${s0.title}": ¿Cuál es la idea angular expuesta en el primer párrafo y cómo impacta en la práctica?`,
        expectedKeyPoints: [
          'Definición de causa y efecto',
          'Diferenciación conceptual clara',
          'Aplicación práctica'
        ],
        canonicalAnswer: sentences[0] || 'Respuesta canónica grounded.',
        sourceReference: s0.title
      });
    } finally {
      setIsLoadingRecall(false);
    }
  };

  const markFlashcardMastered = (idx: number) => {
    const card = flashcardsList[idx];
    if (!card) return;
    const cardId = card.id || `card-${idx}`;
    if (!masteredFlashcardIds[cardId]) {
      setMasteredFlashcardIds(prev => ({ ...prev, [cardId]: true }));
      onUpdateStats({
        flashcardsMastered: stats.flashcardsMastered + 1,
        xpPoints: stats.xpPoints + 15
      });
    }
    setIsCardFlipped(false);
    setActiveFlashcardIndex((prev) => (prev + 1) % flashcardsList.length);
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((stats.focusMinutesToday / 60) * 100));
  const isGoalReached = stats.focusMinutesToday >= 60;

  // Completed counts in current cycle
  const completedStudySessions = cycleStages.filter((s, idx) => s.type === 'study' && idx < currentStageIndex).length;
  const completedShortBreaks = cycleStages.filter((s, idx) => s.type === 'short_break' && idx < currentStageIndex).length;
  const isLongBreakCompleted = currentStageIndex > 7;

  return (
    <div className="space-y-6 relative">
      {/* 1. FOCUS MODE ACTIVE IMMERSIVE HEADER BAR (WITH PROMINENT RED EXIT BUTTON) */}
      {isFocusModeActive && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                  FOCUS MODE ACTIVO
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 font-bold text-slate-300 border border-white/10">
                  Entorno Blindado
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Funciones de estudio y estadísticas disponibles · Cuaderno: <strong>{notebook.title}</strong>
              </p>
            </div>
          </div>

          {/* BOTÓN ROJO: SALIR DEL FOCUS MODE */}
          <button
            type="button"
            onClick={() => setIsExitConfirmModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer border border-rose-400/30 shrink-0"
            title="Salir del Focus Mode"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Salir del Focus Mode</span>
          </button>
        </div>
      )}

      {/* 2. BARRA DE PROGRESO DE ESTUDIO EFECTIVO (0 A 60M) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Progreso Diario de Estudio Efectivo
                </h4>
                {isGoalReached && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Meta Cumplida
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {isGoalReached
                  ? '¡Has completado la meta diaria de 60 minutos de estudio efectivo!'
                  : `Faltan ${Math.max(0, 60 - stats.focusMinutesToday)} minutos para completar la meta de hoy.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.focusMinutesToday}m
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ 60m</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Barra verde que se llena con el pasar de los minutos */}
        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 rounded-full transition-all duration-500 shadow-sm relative overflow-hidden"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Indicadores de hito */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1">
          <span>0m</span>
          <span>15m</span>
          <span>30m</span>
          <span>45m</span>
          <span className={isGoalReached ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
            60m (Meta de Racha)
          </span>
        </div>
      </div>

      {/* 3. CARTEL DE FELICITACIONES CUANDO SE CUMPLEN LOS 60M (+1 DÍA DE RACHA) */}
      {isGoalReached && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xl shadow-emerald-600/25 border-2 border-emerald-300 dark:border-emerald-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-2xl shadow-inner border border-white/30">
              🎉
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                <span>Felicidades! +1 dia de racha</span>
              </h3>
              <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                Has alcanzado los 60 minutos de estudio efectivo hoy. Tu racha diaria se encuentra activa con {stats.currentStreakDays} {stats.currentStreakDays === 1 ? 'día' : 'días'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-black shrink-0 border border-white/30 shadow-xs">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>Racha Actual: {stats.currentStreakDays} {stats.currentStreakDays === 1 ? 'Día' : 'Días'}</span>
          </div>
        </div>
      )}

      {/* 4. SECCIÓN PRINCIPAL: MÉTODOS DE ESTUDIO ACTIVO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-extrabold uppercase tracking-wide mb-1">
            Métodos de Aprendizaje Activo
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Entorno de Concentración y Retención
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
            "Los métodos de estudio utilizan el contenido de <strong className="text-slate-900 dark:text-white">{notebook.title}</strong> como contexto directo."
          </p>
        </div>

        {/* Sub-Pestañas */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { id: 'progreso' as const, label: 'Gráfica Semanal', icon: BarChart3 },
            { id: 'pomodoro' as const, label: 'Pomodoro (Focus mode)', icon: Clock },
            { id: 'active_recall' as const, label: 'Active Recall', icon: Brain },
            { id: 'flashcards' as const, label: 'Flashcards', icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeMethodTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMethodTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MÉTODO 0: PANEL DE VISUALIZACIÓN RECHARTS (GRÁFICA SEMANAL DE ESTUDIO) */}
      {activeMethodTab === 'progreso' && (
        <div className="space-y-6 animate-in fade-in">
          <WeeklyStudyChart
            stats={stats}
            onUpdateStats={onUpdateStats}
            notebookTitle={notebook.title}
          />
        </div>
      )}

      {/* MÉTODO 1: POMODORO CON CICLO COMPLETO CONFIGURABLE (4 SESIONES + DESCANSOS + DESCANSO LARGO) */}
      {activeMethodTab === 'pomodoro' && (
        <div className="space-y-6">
          {/* SI EL CICLO NO HA COMENZADO: CARTEL COLORIDO PARA INICIAR CICLO Y ELEGIR PARÁMETROS */}
          {!isCycleStarted ? (
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-400/30 relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-white border border-white/30">
                    <Clock className="w-4 h-4 text-amber-300" />
                    <span>Configuración de Ciclo Pomodoro</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Iniciar ciclo pomodoro
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-xl mx-auto">
                    Elige la duración de tus sesiones y descansos. El ciclo completo consta de 4 sesiones de estudio alternadas con descansos cortos, y un descanso largo reparador tras la 4ta sesión.
                  </p>
                </div>

                {/* Selectores de Parámetros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Parámetro 1: Sesiones de estudio */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2.5">
                    <label className="block text-xs font-black uppercase tracking-wide text-indigo-200">
                      Sesiones de estudio
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([20, 25, 30] as const).map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setStudyDurationSetting(mins)}
                          className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                            studyDurationSetting === mins
                              ? 'bg-white text-indigo-900 border-white shadow-md'
                              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-indigo-200/80 block text-center font-semibold">
                      Duración de cada sesión activa
                    </span>
                  </div>

                  {/* Parámetro 2: Descansos (5 minutos únicamente) */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wide text-indigo-200">
                        Descansos
                      </label>
                      <div className="mt-2 py-2 px-3 rounded-xl bg-white/20 border border-white/30 text-xs font-black text-white text-center flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                        <span>5 minutos únicamente</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-200/80 block text-center font-semibold">
                      Pausa corta tras sesiones 1, 2 y 3
                    </span>
                  </div>

                  {/* Parámetro 3: Descanso largo */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2.5">
                    <label className="block text-xs font-black uppercase tracking-wide text-indigo-200">
                      Descanso largo (4ta sesión)
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {([15, 20, 25, 30] as const).map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setLongBreakDurationSetting(mins)}
                          className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                            longBreakDurationSetting === mins
                              ? 'bg-white text-indigo-900 border-white shadow-md'
                              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-indigo-200/80 block text-center font-semibold">
                      Recuperación profunda final
                    </span>
                  </div>
                </div>

                {/* Resumen del Ciclo Configurado */}
                <div className="p-3.5 bg-black/20 rounded-2xl border border-white/15 text-xs text-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      Ciclo: <strong>4 sesiones de {studyDurationSetting}m</strong> + <strong>3 descansos de 5m</strong> + <strong>1 descanso largo de {longBreakDurationSetting}m</strong>.
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-200 font-bold shrink-0">
                    Total: {studyDurationSetting * 4 + 5 * 3 + longBreakDurationSetting} min de ciclo
                  </span>
                </div>

                {/* Botón Principal para Comenzar */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleStartCycle}
                    className="px-8 py-4 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-900 font-black text-sm shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition cursor-pointer inline-flex items-center gap-2.5"
                  >
                    <Play className="w-4 h-4 fill-indigo-900 text-indigo-900" />
                    <span>Iniciar ciclo pomodoro</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* EL CICLO ESTÁ ACTIVO: MOSTRAR EL TEMPORIZADOR Y SEGUIMIENTO DEL CICLO */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Pomodoro Clock Card */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between text-center relative">
                  {/* Botón para cambiar parámetros del ciclo si lo desea */}
                  <button
                    type="button"
                    onClick={handleResetCycle}
                    className="absolute top-5 right-5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Reiniciar y configurar otro ciclo"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Configurar Ciclo</span>
                  </button>

                  {/* Etapa actual del ciclo */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                    {currentStage.type === 'study' ? (
                      <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Flame className="w-4 h-4 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
                        <span>Sesión de Estudio {currentStage.sessionNumber} de 4 ({currentStage.durationMinutes} min)</span>
                      </span>
                    ) : currentStage.type === 'short_break' ? (
                      <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Descanso Corto {currentStage.breakNumber} de 3 (5 min)</span>
                      </span>
                    ) : (
                      <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Descanso Largo Final ({currentStage.durationMinutes} min)</span>
                      </span>
                    )}
                  </div>

                  {/* Timer Display */}
                  <div className="my-4">
                    <span className="text-7xl sm:text-8xl font-black tracking-tighter text-slate-900 dark:text-white font-mono select-none">
                      {formatTimer(timerSeconds)}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      Cuaderno: <strong className="text-slate-800 dark:text-slate-200">{notebook.title}</strong> · {currentStage.label}
                    </p>
                  </div>

                  {/* Timer Action Buttons (Manual Activation Required) */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleTimer}
                      className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white shadow-md transition cursor-pointer ${
                        isTimerRunning
                          ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                          : currentStage.type === 'study'
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-5 h-5" />
                          <span>Pausar Etapa</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-white" />
                          <span>
                            {currentStage.type === 'study' ? 'Iniciar Concentración' : 'Iniciar Descanso'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetCurrentTimer}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Reiniciar etapa actual"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* CONTROLES A MODO DE PRUEBA */}
                  <div className="mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase">
                        A modo de prueba
                      </span>
                      <span>Probar avance:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAddOneMinuteTest}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xs hover:border-indigo-400 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        title="Avanzar 1 minuto inmediatamente"
                      >
                        <FastForward className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>+1 min</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddTenMinutesTest}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xs hover:border-emerald-400 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        title="Avanzar 10 minutos"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>+10 min</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCompleteCurrentStage}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        title="Terminar etapa actual para disparar alarma y pop-up"
                      >
                        <Bell className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Fin Etapa (Prueba)</span>
                      </button>

                      <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isTestModeSpeed}
                          onChange={(e) => setIsTestModeSpeed(e.target.checked)}
                          className="rounded text-indigo-600 w-3.5 h-3.5"
                        />
                        <span>1s = 1m</span>
                      </label>
                    </div>
                  </div>

                  {/* DEBAJO DE MODO DE PRUEBA: REGISTRO Y CONTEO DEL CICLO POMODORO */}
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full text-left space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">
                          Registro del Ciclo: Conteo de Sesiones y Descansos
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Sesiones: <strong className="text-indigo-600 dark:text-indigo-400">{completedStudySessions} / 4</strong>
                        </span>
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Descansos: <strong className="text-emerald-600 dark:text-emerald-400">{completedShortBreaks} / 3</strong>
                        </span>
                        {isLongBreakCompleted && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            Descanso largo finalizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Línea visual de las 8 etapas del ciclo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
                      {cycleStages.map((stg, idx) => {
                        const isCurrent = idx === currentStageIndex;
                        const isPassed = idx < currentStageIndex;
                        const isFuture = idx > currentStageIndex;

                        return (
                          <div
                            key={stg.id}
                            className={`p-2 rounded-xl border text-center transition-all text-[11px] ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400/50 shadow-md scale-105'
                                : isPassed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 opacity-90'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span className="block font-black text-[10px] uppercase truncate">
                              {stg.shortLabel}
                            </span>
                            <span className="block font-extrabold text-[12px] mt-0.5">
                              {stg.durationMinutes}m
                            </span>
                            <span className="block text-[9px] font-bold mt-0.5 opacity-80">
                              {isCurrent ? '● Activa' : isPassed ? '✓ Hecha' : '○ Espera'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FOCUS MODE ACTIVATION (BOTÓN COLOR CELESTE INTENSO) */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={handleRequestFocusMode}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs tracking-wide transition-all cursor-pointer ${
                        isFocusModeActive
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xl shadow-sky-500/40 border-2 border-sky-200 ring-4 ring-sky-400/30'
                          : 'bg-sky-500 hover:bg-sky-400 active:scale-95 text-white shadow-lg shadow-sky-500/30 border border-sky-300 hover:shadow-sky-500/50'
                      }`}
                      title="Activar Focus mode"
                    >
                      <Shield className="w-4 h-4 text-white fill-white/20" />
                      <span>{isFocusModeActive ? 'Focus mode (Activo)' : 'Focus mode'}</span>
                    </button>

                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center sm:text-right">
                      {isFocusModeActive
                        ? '🛡️ Entorno blindado activo: atajos y distracciones bloqueadas'
                        : '💡 Haz clic en Focus mode para bloquear distracciones externas'}
                    </span>
                  </div>
                </div>

                {/* Columna Derecha: Descanso Activo y Rendimiento */}
                <div className="space-y-4">
                  {/* Active Break Box */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Recuperación Activa en Descansos</span>
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">
                      Micropregunta de Fijación
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                      "Los descansos pueden utilizarse para realizar pequeños ejercicios de recuperación activa sin agotar la mente."
                    </p>

                    {notebook.sources.length > 0 ? (
                      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 space-y-3">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          ¿Cuál es el concepto central que extrajiste de "{notebook.sources[0]?.title}"?
                        </p>

                        {breakAnswerRevealed ? (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed animate-in fade-in">
                            <strong>Respuesta canónica:</strong> En Lean Startup, el rigor es empírico y se mide en aprendizaje validado.
                          </div>
                        ) : (
                          <button
                            onClick={() => setBreakAnswerRevealed(true)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                          >
                            Revelar Micro-Respuesta
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400">
                        Carga al menos una fuente para habilitar micropreguntas contextuales.
                      </div>
                    )}
                  </div>

                  {/* Focus Metrics Summary */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6 shadow-xs space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Tu Rendimiento Hoy
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Minutos hoy</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.focusMinutesToday}m</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Bloques compl.</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.sessionsCompleted}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Racha</span>
                        <span className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.currentStreakDays} días</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Bloqueos Tab</span>
                        <span className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.tamperAttemptsBlocked}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MÉTODO 2: ACTIVE RECALL */}
      {activeMethodTab === 'active_recall' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Recuperación Activa del Cuaderno
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              La IA formula una pregunta de alta demanda cognitiva basada en tus fuentes. Fuerza a tu mente a reconstruir el concepto antes de mirar la solución.
            </p>
          </div>

          {!recallChallenge ? (
            <div className="text-center py-8">
              <button
                onClick={handleFetchActiveRecall}
                disabled={isLoadingRecall}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${isLoadingRecall ? 'animate-spin' : ''}`} />
                <span>{isLoadingRecall ? 'Analizando fuentes y generando desafío...' : 'Generar Desafío de Active Recall'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Pregunta de Desafío</span>
                  <span>Fuente: {recallChallenge.sourceReference}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {recallChallenge.challengeQuestion}
                </h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Escribe tu explicación con tus propias palabras (sin mirar las notas):
                </label>
                <textarea
                  rows={4}
                  placeholder="Intenta articular la respuesta explicando causas, mecanismos y conclusiones..."
                  value={userRecallAnswer}
                  onChange={(e) => setUserRecallAnswer(e.target.value)}
                  className="w-full p-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleFetchActiveRecall}
                  disabled={isLoadingRecall}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cambiar Pregunta
                </button>

                <button
                  onClick={() => setShowCanonicalAnswer(!showCanonicalAnswer)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  {showCanonicalAnswer ? 'Ocultar Solución' : 'Comparar con Respuesta Canónica'}
                </button>
              </div>

              {showCanonicalAnswer && (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Respuesta Canónica de las Fuentes
                  </h5>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-sans">
                    {recallChallenge.canonicalAnswer}
                  </p>

                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-1">
                      Puntos que deberías haber mencionado:
                    </span>
                    <ul className="space-y-1 text-xs text-emerald-800 dark:text-emerald-300">
                      {recallChallenge.expectedKeyPoints?.map((pt, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MÉTODO 3: FLASHCARDS */}
      {activeMethodTab === 'flashcards' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {flashcardsList.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  {flashcardsList[activeFlashcardIndex]?.category || 'Concepto'}
                </span>
                <span className="text-slate-400 font-bold">
                  {activeFlashcardIndex + 1} de {flashcardsList.length}
                </span>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className={`min-h-[220px] p-8 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isCardFlipped
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300'
                }`}
              >
                <div className="text-right text-[11px] opacity-70">
                  {isCardFlipped ? 'Respuesta fundamentada' : 'Pregunta de examen'}
                </div>

                <div className="my-6 text-center">
                  <h4 className={`text-base sm:text-lg font-bold leading-relaxed ${isCardFlipped ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {isCardFlipped
                      ? flashcardsList[activeFlashcardIndex]?.answer
                      : flashcardsList[activeFlashcardIndex]?.question}
                  </h4>
                </div>

                <div className="text-center text-[11px] opacity-70">
                  Click para voltear tarjeta
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setIsCardFlipped(false);
                    setActiveFlashcardIndex((prev) => (prev - 1 + flashcardsList.length) % flashcardsList.length);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Anterior
                </button>

                <button
                  onClick={() => markFlashcardMastered(activeFlashcardIndex)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Marcar como Dominada (+15 XP)</span>
                </button>

                <button
                  onClick={() => {
                    setIsCardFlipped(false);
                    setActiveFlashcardIndex((prev) => (prev + 1) % flashcardsList.length);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-900 dark:text-white">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">No hay un mazo de flashcards en este cuaderno</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Genera tu mazo de flashcards en la pestaña <strong>Artefactos</strong> a partir de las fuentes cargadas.
              </p>
              <button
                onClick={onGoToArtifacts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Ir a Generar Flashcards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* POP-UP MODAL 1: AVISO DE ACTIVACIÓN DE FOCUS MODE (EN EL CENTRO DE LA PANTALLA) */}
      {isFocusWarningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Entorno de Máxima Concentración
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Aviso de activación de Focus mode
                </h3>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed">
              <p className="font-extrabold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Atención: Restricción activa del entorno</span>
              </p>
              <p>
                Se bloquearán el resto de las funciones fuera de la pestaña de estudio, incluyendo algunas funciones y atajos de la computadora (como notificaciones, o comandos como <strong>Alt + Tab</strong>, o <strong>Windows + D</strong>).
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                <span>Solo permanecerá disponible el área de estudio con Pomodoro, Active Recall, Flashcards y Gráfica Semanal.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                <span>Tu pantalla entrará en modo inmersivo de pantalla completa.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                <span>Podrás salir en cualquier momento usando el botón rojo <strong>"Salir del Focus Mode"</strong>.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFocusWarningModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmActivateFocus}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Activar Focus mode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL 2: CONFIRMACIÓN ANTES DE SALIR DEL FOCUS MODE */}
      {isExitConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-rose-200 dark:border-rose-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Confirmación de salida
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  ¿Estás seguro de salir del Focus Mode?
                </h3>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900 dark:text-white">
                Si sales ahora, no se contará el bloque de estudio para la estadística y solo se contarán los minutos efectivos de estudio.
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Minutos efectivos hoy:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{stats.focusMinutesToday} minutos</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Bloque de sesión:</span>
                <strong className="text-rose-600 dark:text-rose-400 font-bold">No se contará</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExitConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Continuar Estudiando
              </button>
              <button
                type="button"
                onClick={handleConfirmExitFocus}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>Salir del Focus Mode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP FLOTANTE DEBAJO A LA DERECHA: AVISA QUE SE ACABÓ EL TIEMPO Y COMIENZA LA SIGUIENTE ETAPA */}
      {stageEndNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300 shadow-2xl">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-400 dark:border-indigo-600 text-slate-900 dark:text-white shadow-2xl space-y-3 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setStageEndNotice(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce text-amber-600 dark:text-amber-400" />
              </div>
              <div className="pr-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Alarma Pomodoro
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  ¡Se acabó el tiempo!
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Finalizó con éxito: <strong>{stageEndNotice.finishedStageLabel}</strong>.
            </p>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-950 dark:text-indigo-200">
              <span className="block text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                Siguiente etapa:
              </span>
              <strong className="block text-sm font-black text-indigo-900 dark:text-white mt-0.5">
                {stageEndNotice.nextStageLabel} ({stageEndNotice.nextStageDuration} min)
              </strong>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                * Los temporizadores no son automáticos, actívalo cuando estés listo.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStageEndNotice(null);
                  toggleTimer();
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  stageEndNotice.nextStageType === 'study'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>
                  {stageEndNotice.nextStageType === 'study' ? 'Iniciar Concentración' : 'Iniciar Descanso'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStageEndNotice(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
