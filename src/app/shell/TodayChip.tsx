import {Link} from 'react-router';
import {cx} from '../../ui/internal/cx';
import {useAppState} from '../AppStateContext';
import {useDailyGoal} from '../../features/progress/dailyGoal';
import {SHELL_PATHS} from './paths';
import {Icon} from '../../ui/Icon';

/** "{min}/{goal} min" + streak; links to Progreso (spec 3.2). */
export function TodayChip() {
  const {stats} = useAppState();
  const [goal] = useDailyGoal();
  const minutes = stats.focusMinutesToday;
  const streak = stats.currentStreakDays;
  const met = minutes >= goal;
  const days = streak === 1 ? 'día' : 'días';

  return (
    <Link
      to={SHELL_PATHS.progress}
      aria-label={`Hoy ${minutes} de ${goal} minutos, racha de ${streak} ${days}. Ver progreso`}
      className="relative inline-flex h-8 items-center gap-2 rounded-pill bg-subtle px-3 text-label text-strong transition-colors duration-[120ms] hover:bg-hairline pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-['']"
    >
      <Icon name="clock" className={cx('size-4', met ? 'text-success' : 'text-muted')} />
      <span>
        {minutes}/{goal}
        <span className="hidden min-[400px]:inline"> min</span>
      </span>
      <Icon name="streak" className="size-4 text-accent-star" />
      <span>{streak}</span>
    </Link>
  );
}
