/**
 * Pure state machine for a study session (Pomodoro cycle).
 *
 * Cycle: study, short, study, short, study, short, study, long (4 study
 * blocks). Stages never chain automatically: when a stage completes the
 * session waits (`between`) until the student resumes. Minutes are credited
 * exactly once, when a study stage completes. No timers or side effects here;
 * the UI feeds elapsed seconds through `tick`.
 */

export type StageType = 'study' | 'short' | 'long';
export type SessionStatus = 'running' | 'paused' | 'between' | 'finished';

export interface SessionConfig {
  studyMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** Number of study blocks in the cycle. */
  cycles: number;
}

export const DEFAULT_CONFIG: SessionConfig = {
  studyMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 20,
  cycles: 4,
};

export interface Stage {
  type: StageType;
  minutes: number;
  /** 1-based study block number (study stages only). */
  block?: number;
}

export interface CompletedStage {
  /** Increases with every completion so the UI can react exactly once. */
  seq: number;
  type: StageType;
  /** Minutes credited by this completion (0 for breaks). */
  creditedMinutes: number;
}

export interface SessionState {
  config: SessionConfig;
  stageIndex: number;
  remainingSeconds: number;
  status: SessionStatus;
  creditedMinutes: number;
  completedStudyBlocks: number;
  /** Stage types completed so far, in order (drives the session log). */
  log: StageType[];
  lastCompleted: CompletedStage | null;
}

export type SessionAction =
  | {type: 'pause'}
  | {type: 'resume'}
  | {type: 'tick'; seconds: number}
  | {type: 'finish'}
  /** Debug only: complete the current stage immediately. */
  | {type: 'skipStage'};

export function buildStages(config: SessionConfig): Stage[] {
  const stages: Stage[] = [];
  for (let block = 1; block <= config.cycles; block++) {
    stages.push({type: 'study', minutes: config.studyMinutes, block});
    stages.push(
      block < config.cycles
        ? {type: 'short', minutes: config.shortBreakMinutes}
        : {type: 'long', minutes: config.longBreakMinutes},
    );
  }
  return stages;
}

export function currentStage(state: SessionState): Stage {
  const stages = buildStages(state.config);
  return stages[Math.min(state.stageIndex, stages.length - 1)];
}

/** Starts a session: first study stage, running. */
export function createSession(config: SessionConfig = DEFAULT_CONFIG): SessionState {
  return {
    config,
    stageIndex: 0,
    remainingSeconds: config.studyMinutes * 60,
    status: 'running',
    creditedMinutes: 0,
    completedStudyBlocks: 0,
    log: [],
    lastCompleted: null,
  };
}

/** A session is active until it finishes (running, paused or waiting). */
export function isActive(state: SessionState): boolean {
  return state.status !== 'finished';
}

function completeStage(state: SessionState): SessionState {
  const stages = buildStages(state.config);
  const stage = stages[state.stageIndex];
  const credited = stage.type === 'study' ? stage.minutes : 0;
  const completed: CompletedStage = {
    seq: (state.lastCompleted?.seq ?? 0) + 1,
    type: stage.type,
    creditedMinutes: credited,
  };
  const next: SessionState = {
    ...state,
    creditedMinutes: state.creditedMinutes + credited,
    completedStudyBlocks: state.completedStudyBlocks + (stage.type === 'study' ? 1 : 0),
    log: [...state.log, stage.type],
    lastCompleted: completed,
  };
  const nextIndex = state.stageIndex + 1;
  if (nextIndex >= stages.length) {
    return {...next, remainingSeconds: 0, status: 'finished'};
  }
  return {
    ...next,
    stageIndex: nextIndex,
    remainingSeconds: stages[nextIndex].minutes * 60,
    status: 'between',
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'pause':
      return state.status === 'running' ? {...state, status: 'paused'} : state;
    case 'resume':
      return state.status === 'paused' || state.status === 'between' ? {...state, status: 'running'} : state;
    case 'tick': {
      if (state.status !== 'running' || action.seconds <= 0) return state;
      const remaining = state.remainingSeconds - Math.floor(action.seconds);
      // Overshoot (e.g. a throttled background tab) completes this stage only.
      return remaining <= 0 ? completeStage(state) : {...state, remainingSeconds: remaining};
    }
    case 'skipStage':
      return state.status === 'running' || state.status === 'paused' ? completeStage(state) : state;
    case 'finish':
      return state.status === 'finished' ? state : {...state, status: 'finished'};
  }
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
