import {useNavigate} from 'react-router';
import {Button, Card, Highlight, Reveal, RevealItem} from '../../ui';
import {useStudySession, type SessionSummaryData} from './StudySessionProvider';

/** Session finished: minutes, blocks and tab exits. */
export function SessionSummary({summary}: {summary: SessionSummaryData}) {
  const {clearSummary} = useStudySession();
  const navigate = useNavigate();
  const items = [
    {label: 'Minutos de estudio', value: summary.minutes},
    {label: 'Bloques completados', value: summary.blocks},
    {label: 'Salidas de la sesión', value: summary.tabLeaves},
  ];
  return (
    <Card className="w-full max-w-narrow space-y-6 p-6">
      <h2 className="text-h1 text-strong">
        <Highlight trigger="mount">Sesión terminada</Highlight>
      </h2>
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
