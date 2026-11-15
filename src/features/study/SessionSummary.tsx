import {useNavigate} from 'react-router';
import {Button, Card} from '../../ui';
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
    <Card className="mx-auto w-full max-w-[560px] space-y-6 p-6">
      <h2 className="text-h2 text-strong">Sesión terminada</h2>
      <dl className="grid grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col-reverse rounded-control bg-subtle p-3 text-center">
            <dt className="text-caption text-muted">{it.label}</dt>
            <dd className="text-h1 tabular-nums text-strong">{it.value}</dd>
          </div>
        ))}
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
