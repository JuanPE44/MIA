import {Link} from 'react-router';
import {Clock, Flame} from 'lucide-react';
import {cx} from '../../ui/internal/cx';
import {useAppState} from '../AppStateContext';
import {SHELL_PATHS} from './paths';

/** Daily focus goal in minutes. TODO(L9): read it from the Progreso goal setting. */
export const DAILY_GOAL_MIN = 60;

/** "{min}/{goal} min" + streak; links to Progreso (spec 3.2). */
export function TodayChip() {
  const {stats} = useAppState();
  const minutes = stats.focusMinutesToday;
  const streak = stats.currentStreakDays;
  const met = minutes >= DAILY_GOAL_MIN;
  const days = streak === 1 ? 'día' : 'días';

  return (
    <Link
      to={SHELL_PATHS.progress}
      aria-label={`Hoy ${minutes} de ${DAILY_GOAL_MIN} minutos, racha de ${streak} ${days}. Ver progreso`}
      className="relative inline-flex h-8 items-center gap-2 rounded-pill bg-subtle px-3 text-label text-strong transition-colors duration-[120ms] hover:bg-hairline pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-['']"
    >
      <Clock aria-hidden className={cx('size-4', met ? 'text-success' : 'text-muted')} />
      <span>
        {minutes}/{DAILY_GOAL_MIN}
        <span className="hidden min-[400px]:inline"> min</span>
      </span>
      <Flame aria-hidden className="size-4 text-accent-star" />
      <span>{streak}</span>
    </Link>
  );
}
