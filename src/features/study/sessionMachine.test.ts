import {describe, expect, it} from 'vitest';
import {
  buildStages,
  createSession,
  currentStage,
  DEFAULT_CONFIG,
  formatClock,
  isActive,
  sessionReducer,
  type SessionAction,
  type SessionState,
} from './sessionMachine';

const run = (s: SessionState, ...actions: SessionAction[]) => actions.reduce(sessionReducer, s);
const full = (s: SessionState) => ({type: 'tick', seconds: s.remainingSeconds}) as const;

describe('sessionMachine', () => {
  it('builds 4 study blocks, 3 short breaks and a final long break', () => {
    const types = buildStages(DEFAULT_CONFIG).map((s) => s.type);
    expect(types).toEqual(['study', 'short', 'study', 'short', 'study', 'short', 'study', 'long']);
  });

  it('starts running on the first study stage', () => {
    const s = createSession({...DEFAULT_CONFIG, studyMinutes: 20});
    expect(s.status).toBe('running');
    expect(currentStage(s)).toMatchObject({type: 'study', block: 1});
    expect(s.remainingSeconds).toBe(20 * 60);
  });

  it('counts down only while running', () => {
    let s = run(createSession(), {type: 'tick', seconds: 10});
    expect(s.remainingSeconds).toBe(25 * 60 - 10);
    s = run(s, {type: 'pause'}, {type: 'tick', seconds: 30});
    expect(s.status).toBe('paused');
    expect(s.remainingSeconds).toBe(25 * 60 - 10);
    s = run(s, {type: 'resume'}, {type: 'tick', seconds: 5});
    expect(s.remainingSeconds).toBe(25 * 60 - 15);
  });

  it('credits study minutes once and waits before the break', () => {
    let s = createSession();
    s = run(s, full(s));
    expect(s.status).toBe('between');
    expect(s.creditedMinutes).toBe(25);
    expect(s.completedStudyBlocks).toBe(1);
    expect(s.lastCompleted).toMatchObject({seq: 1, type: 'study', creditedMinutes: 25});
    expect(currentStage(s).type).toBe('short');
    expect(s.remainingSeconds).toBe(5 * 60);
    // Extra ticks while waiting never credit again.
    s = run(s, {type: 'tick', seconds: 600});
    expect(s.creditedMinutes).toBe(25);
    expect(s.lastCompleted?.seq).toBe(1);
  });

  it('completes a single stage on overshoot and discards the excess', () => {
    const s = run(createSession(), {type: 'tick', seconds: 99999});
    expect(s.stageIndex).toBe(1);
    expect(s.remainingSeconds).toBe(5 * 60);
    expect(s.creditedMinutes).toBe(25);
  });

  it('does not credit minutes for breaks', () => {
    let s = createSession();
    s = run(s, full(s), {type: 'resume'});
    s = run(s, full(s));
    expect(s.creditedMinutes).toBe(25);
    expect(s.lastCompleted).toMatchObject({type: 'short', creditedMinutes: 0});
  });

  it('runs the whole cycle and finishes after the long break', () => {
    let s = createSession({...DEFAULT_CONFIG, studyMinutes: 20, longBreakMinutes: 15});
    while (isActive(s)) {
      s = run(s, {type: 'resume'});
      s = run(s, full(s));
    }
    expect(s.status).toBe('finished');
    expect(s.creditedMinutes).toBe(80);
    expect(s.completedStudyBlocks).toBe(4);
    expect(s.log).toEqual(['study', 'short', 'study', 'short', 'study', 'short', 'study', 'long']);
  });

  it('finish keeps credited minutes and ignores further actions', () => {
    let s = createSession();
    s = run(s, full(s), {type: 'resume'}, {type: 'tick', seconds: 30}, {type: 'finish'});
    expect(s.status).toBe('finished');
    expect(s.creditedMinutes).toBe(25);
    const after = run(s, {type: 'resume'}, {type: 'tick', seconds: 60}, {type: 'skipStage'});
    expect(after).toBe(s);
  });

  it('does not credit a partially elapsed study stage when finishing early', () => {
    const s = run(createSession(), {type: 'tick', seconds: 20 * 60}, {type: 'finish'});
    expect(s.creditedMinutes).toBe(0);
  });

  it('skipStage completes the current stage (debug)', () => {
    const s = run(createSession(), {type: 'skipStage'});
    expect(s.creditedMinutes).toBe(25);
    expect(s.status).toBe('between');
  });

  it('formats the clock as mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(25 * 60)).toBe('25:00');
    expect(formatClock(61)).toBe('01:01');
  });
});
