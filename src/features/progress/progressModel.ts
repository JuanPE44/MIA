import type {DailyStudyLog, UserStudyStats} from '../../types';

export interface WeekDay {
  day: string;
  fullDay: string;
  date: string;
  minutes: number;
  sessions: number;
  isToday: boolean;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Seven days ending today, all empty (accounts without `weeklyLogs`). */
function emptyWeek(): WeekDay[] {
  const now = new Date();
  return Array.from({length: 7}, (_, i) => {
    const offset = 6 - i;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const short = capitalize(d.toLocaleDateString('es', {weekday: 'short'}).replace('.', ''));
    const full = capitalize(d.toLocaleDateString('es', {weekday: 'long'}));
    return {
      day: short,
      fullDay: offset === 0 ? `${full} (hoy)` : full,
      date: offset === 0 ? 'Hoy' : d.toLocaleDateString('es', {day: 'numeric', month: 'short'}),
      minutes: 0,
      sessions: 0,
      isToday: offset === 0,
    };
  });
}

/** The week shown in the chart; the last entry is always today and mirrors `focusMinutesToday`. */
export function buildWeek(stats: UserStudyStats): WeekDay[] {
  const logs = stats.weeklyLogs;
  const base: WeekDay[] =
    logs && logs.length > 0
      ? logs.map((l, i) => ({
          day: l.day,
          fullDay: l.fullDay,
          date: l.date,
          minutes: l.minutes,
          sessions: l.sessions,
          isToday: i === logs.length - 1,
        }))
      : emptyWeek();
  return base.map((d) => (d.isToday ? {...d, minutes: stats.focusMinutesToday} : d));
}

export function toDailyLogs(week: WeekDay[], goal: number): DailyStudyLog[] {
  return week.map(({day, fullDay, date, minutes, sessions}) => ({
    day,
    fullDay,
    date,
    minutes,
    sessions,
    targetMinutes: goal,
  }));
}

export function hasActivity(stats: UserStudyStats, week: WeekDay[]): boolean {
  return (
    stats.sessionsCompleted > 0 ||
    stats.xpPoints > 0 ||
    stats.totalFocusHours > 0 ||
    stats.focusMinutesToday > 0 ||
    week.some((d) => d.minutes > 0)
  );
}
