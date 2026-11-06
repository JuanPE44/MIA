import {useSyncExternalStore} from 'react';

/** New key (no legacy persisted goal existed: the old chart kept it in component state). */
export const DAILY_GOAL_KEY = 'mia_daily_goal_v1';
export const GOAL_OPTIONS = [30, 45, 60, 90] as const;
export const DEFAULT_DAILY_GOAL = 60;

function read(): number {
  try {
    const value = Number(localStorage.getItem(DAILY_GOAL_KEY));
    return (GOAL_OPTIONS as readonly number[]).includes(value) ? value : DEFAULT_DAILY_GOAL;
  } catch {
    return DEFAULT_DAILY_GOAL;
  }
}

let current = read();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function setDailyGoal(minutes: number) {
  current = minutes;
  try {
    localStorage.setItem(DAILY_GOAL_KEY, String(minutes));
  } catch {
    // Storage unavailable: the goal still applies for this session.
  }
  listeners.forEach((listener) => listener());
}

/** Daily goal in minutes; shared by the TopBar TodayChip and the Progreso page. */
export function useDailyGoal(): readonly [number, (minutes: number) => void] {
  const goal = useSyncExternalStore(subscribe, () => current, () => DEFAULT_DAILY_GOAL);
  return [goal, setDailyGoal] as const;
}
