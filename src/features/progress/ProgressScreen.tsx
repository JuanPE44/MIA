import {useMemo} from 'react';
import {useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import {Button, Card, EmptyState, useToast} from '../../ui';
import {SelectField} from '../library/SelectField';
import {GOAL_OPTIONS, useDailyGoal} from './dailyGoal';
import {buildWeek, hasActivity, toDailyLogs} from './progressModel';
import {StatTile} from './StatTile';
import {WeeklyChart} from './WeeklyChart';
import {Icon} from '../../ui/Icon';

const number = new Intl.NumberFormat('es');

/** "Tu progreso" (S9): the one place for study metrics, weekly chart, goal and manual log. */
export function ProgressScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const {stats, handleUpdateStats, activeNotebook} = useAppState();
  const [goal, setGoal] = useDailyGoal();

  const week = useMemo(() => buildWeek(stats), [stats]);
  const minutes = stats.focusMinutesToday;
  const met = minutes >= goal;
  const pct = Math.min(100, Math.round((minutes / goal) * 100));

  const logMinutes = (mins: number) => {
    const previous = {
      focusMinutesToday: stats.focusMinutesToday,
      totalFocusHours: stats.totalFocusHours,
      sessionsCompleted: stats.sessionsCompleted,
      xpPoints: stats.xpPoints,
      weeklyLogs: stats.weeklyLogs,
    };
    const nextToday = stats.focusMinutesToday + mins;
    const nextWeek = week.map((d) =>
      d.isToday ? {...d, minutes: nextToday, sessions: d.sessions + 1} : d,
    );
    handleUpdateStats({
      focusMinutesToday: nextToday,
      totalFocusHours: Math.round((stats.totalFocusHours + mins / 60) * 10) / 10,
      sessionsCompleted: stats.sessionsCompleted + 1,
      xpPoints: stats.xpPoints + mins * 2,
      weeklyLogs: toDailyLogs(nextWeek, goal),
    });
    toast.show({
      message: `Sumaste ${mins} min a tu estudio de hoy.`,
      variant: 'success',
      action: {label: 'Deshacer', onAction: () => handleUpdateStats(previous)},
    });
  };

  const goStudy = () =>
    navigate(activeNotebook ? paths.notebookSegment(activeNotebook.id, 'ESTUDIO') : paths.notebooks());

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-h1 text-strong">Tu progreso</h1>
        <p className="mt-1 text-body text-muted">Resumen de toda tu cuenta, no de un cuaderno en particular.</p>
      </header>

      {!hasActivity(stats, week) ? (
        <Card>
          <EmptyState
            icon={<Icon name="progress" />}
            title="Empieza una sesión para ver tu progreso"
            description="Cuando estudies, aquí vas a ver tu racha, tus minutos y tu semana."
            action={
              <Button variant="primary" onClick={goStudy} leadingIcon={<Icon name="timer" className="size-5" />}>
                {activeNotebook ? 'Ir a Estudiar' : 'Ir a Mis cuadernos'}
              </Button>
            }
          />
        </Card>
      ) : null}

      <section aria-labelledby="progress-today" className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-2">
          <h2 id="progress-today" className="text-h2 text-strong">
            Hoy
          </h2>
          <p className="text-body text-default tabular-nums">
            <span className="text-h1 text-strong">{minutes}</span> / {goal} min
          </p>
          <div
            role="progressbar"
            aria-labelledby="progress-today"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(minutes, goal)}
            aria-valuetext={`${minutes} de ${goal} minutos`}
            className="h-3 w-full overflow-hidden rounded-pill bg-subtle"
          >
            <div
              className={`h-full rounded-pill transition-[width] duration-[120ms] ${met ? 'bg-success' : 'bg-primary'}`}
              style={{width: `${pct}%`}}
            />
          </div>
          {met ? (
            <p className="flex items-center gap-2 text-label text-success">
              <Icon name="success" className="size-5" /> Meta de hoy cumplida
            </p>
          ) : (
            <p className="text-small text-muted">Te faltan {goal - minutes} min para tu meta de hoy.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <SelectField
            label="Meta diaria"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          >
            {GOAL_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g} min
              </option>
            ))}
          </SelectField>
          <div>
            <p className="mb-2 text-label text-strong">Registrar estudio manual</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => logMinutes(15)}>
                +15 min
              </Button>
              <Button variant="secondary" onClick={() => logMinutes(25)}>
                +25 min
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="progress-stats">
        <h2 id="progress-stats" className="sr-only">
          Tus números
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <li>
            <StatTile
              icon={<Icon name="streak" />}
              value={number.format(stats.currentStreakDays)}
              label={stats.currentStreakDays === 1 ? 'día de racha' : 'días de racha'}
            />
          </li>
          <li>
            <StatTile icon={<Icon name="sparkles" />} value={number.format(stats.xpPoints)} label="XP" />
          </li>
          <li>
            <StatTile icon={<Icon name="clock" />} value={number.format(stats.totalFocusHours)} label="horas totales" />
          </li>
          <li>
            <StatTile icon={<Icon name="timer" />} value={number.format(stats.sessionsCompleted)} label="sesiones" />
          </li>
          <li>
            <StatTile icon={<Icon name="materials" />} value={number.format(stats.flashcardsMastered)} label="tarjetas dominadas" />
          </li>
          <li>
            <StatTile
              icon={<Icon name="shield-warning" />}
              value={number.format(stats.tamperAttemptsBlocked)}
              label="salidas de pestaña"
              hint="Veces que saliste de la pestaña durante una sesión en modo blindado."
            />
          </li>
        </ul>
      </section>

      <section aria-labelledby="progress-week">
        <Card className="space-y-4">
          <h2 id="progress-week" className="flex items-center gap-2 text-h2 text-strong">
            <Icon name="book" className="size-5 text-primary-text" /> Esta semana
          </h2>
          <WeeklyChart week={week} goal={goal} />
        </Card>
      </section>
    </div>
  );
}
