import {useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {Button, Card, Confetti, Highlight, Reveal, RevealItem} from '../../ui';
import {Icon} from '../../ui/Icon';
import {useStudySession, type SessionSummaryData} from './StudySessionProvider';

/** Session finished: minutes, blocks and tab exits. */
export function SessionSummary({summary}: {summary: SessionSummaryData}) {
  const {clearSummary} = useStudySession();
  const navigate = useNavigate();
  const {stats} = useAppState();
  const streak = stats.currentStreakDays;
  const items = [
    {label: 'Minutos de estudio', value: summary.minutes},
    {label: 'Bloques completados', value: summary.blocks},
    {label: 'Salidas de la sesión', value: summary.tabLeaves},
  ];
  return (
    <Card className="relative w-full max-w-narrow space-y-6 overflow-hidden p-6">
      <div className="relative">
        <Confetti />
        <h2 className="text-h1 text-strong">
          <Highlight trigger="mount" delay={0.2}>Sesión terminada</Highlight>
        </h2>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-default">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="streak" weight="duotone" className="size-5 text-accent-star" />
            <span className="font-mono tabular-nums text-strong">{streak}</span>{' '}
            {streak === 1 ? 'día de racha' : 'días de racha'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" weight="duotone" className="size-5 text-primary-text" />
            <span className="font-mono tabular-nums text-strong">{stats.focusMinutesToday}</span> min hoy
          </span>
        </p>
      </div>
      <dl>
        <Reveal className="grid grid-cols-3 gap-3">
        {items.map((it) => (
          <RevealItem key={it.label} className="flex flex-col-reverse rounded-control border border-rule bg-subtle p-3 text-center">
            <dt className="text-caption text-muted">{it.label}</dt>
            <dd className="font-mono text-h1 tabular-nums text-strong">{it.value}</dd>
          </RevealItem>
        ))}
        </Reveal>
      </dl>
      <p className="text-small text-muted">
        «Salidas de la sesión» cuenta las veces que cambiaste de pestaña o de ventana con el modo blindado activado.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" className="sm:flex-1" onClick={() => navigate('/progreso')}>
          Ver progreso
        </Button>
        <Button variant="secondary" className="sm:flex-1" onClick={clearSummary}>
          Otra sesión
        </Button>
      </div>
    </Card>
  );
}
