import {Link} from 'react-router';
import {cx} from '../../ui/internal/cx';
import {useAppState} from '../AppStateContext';
import {useDailyGoal} from '../../features/progress/dailyGoal';
import {SHELL_PATHS} from './paths';
import {Icon} from '../../ui/Icon';

/**
 * Editorial "today" block: mono overline, `min / goal`, thin ink progress bar
 * (highlighter fill when the goal is met) and streak. Links to Progreso (spec 3.2).
 * `compact` = one line for the TopBar.
 */
export function TodayChip({compact = false}: {compact?: boolean}) {
  const {stats} = useAppState();
  const [goal] = useDailyGoal();
  const minutes = stats.focusMinutesToday;
  const streak = stats.currentStreakDays;
  const met = minutes >= goal;
  const days = streak === 1 ? 'día' : 'días';
  const pct = goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0;
  // No aria-label: the accessible name is the visible text plus sr-only context (WCAG 2.5.3 label in name).
  const hint = 'de racha, ver progreso';
  const link =
    "relative text-strong transition-colors duration-[120ms] pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-['']";

  const bar = (
    <span
      aria-hidden
      className={cx(
        'block overflow-hidden rounded-pill border border-ink',
        compact ? 'h-1.5 w-10' : 'h-2 w-full',
      )}
    >
      <span className={cx('block h-full', met ? 'bg-highlight' : 'bg-ink')} style={{width: `${pct}%`}} />
    </span>
  );

  if (compact) {
    return (
      <Link
        to={SHELL_PATHS.progress}
        className={cx(link, 'inline-flex h-8 items-center gap-2 rounded-small px-1 hover:bg-subtle')}
      >
        <span className="font-mono text-caption uppercase tracking-widest text-muted">Hoy</span>
        <span className="font-mono text-label">
          {minutes}/{goal}
          <span className="sr-only min-[400px]:not-sr-only"> min</span>
        </span>
        {bar}
        <Icon name="streak" className="size-4 text-ink" />
        <span className="font-mono text-label">{streak}</span>
        <span className="sr-only">
          {days} {hint}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={SHELL_PATHS.progress}
      className={cx(link, 'flex flex-col gap-2 rounded-control border border-rule px-3 py-2.5 hover:border-ink')}
    >
      <span className="font-mono text-caption uppercase tracking-widest text-muted">Hoy</span>
      <span className="font-mono text-label">
        {minutes} / {goal} min
      </span>
      {bar}
      <span className="flex items-center gap-1.5 text-small text-default">
        <Icon name="streak" className="size-4 text-ink" />
        Racha · {streak} {days}
        <span className="sr-only">, ver progreso</span>
      </span>
    </Link>
  );
}
