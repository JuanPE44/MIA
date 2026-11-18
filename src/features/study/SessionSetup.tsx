import {useId, useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {useDailyGoal} from '../progress/dailyGoal';
import {Button, Card, InlineAlert, SegmentedControl, Switch} from '../../ui';
import {useStudySession, type StudySettings} from './StudySessionProvider';
import {Icon} from '../../ui/Icon';

const STUDY_OPTIONS = [20, 25, 30].map((m) => ({value: String(m), label: `${m} min`}));
const LONG_BREAK_OPTIONS = [15, 20, 25, 30].map((m) => ({value: String(m), label: `${m} min`}));

/** S7a: one-step session setup. */
export function SessionSetup() {
  const {settings, setSettings, start} = useStudySession();
  const {stats} = useAppState();
  const [dailyGoal] = useDailyGoal();
  const pct = Math.min(100, Math.round((stats.focusMinutesToday / Math.max(1, dailyGoal)) * 100));
  const [explainOpen, setExplainOpen] = useState(false);
  const studyId = useId();
  const longId = useId();
  const explainId = useId();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
    <Card className="w-full space-y-6 p-6">
      <h2 className="text-h1 text-strong">Sesión de estudio</h2>

      <div className="space-y-2">
        <p id={studyId} className="font-mono text-caption uppercase tracking-widest text-muted">
          Estudio
        </p>
        <SegmentedControl
          aria-labelledby={studyId}
          options={STUDY_OPTIONS}
          value={String(settings.studyMinutes)}
          onValueChange={(v) => setSettings({...settings, studyMinutes: Number(v) as StudySettings['studyMinutes']})}
          className="max-w-full flex-wrap"
        />
      </div>

      <div className="space-y-2">
        <p id={longId} className="font-mono text-caption uppercase tracking-widest text-muted">
          Descanso largo
        </p>
        <SegmentedControl
          aria-labelledby={longId}
          options={LONG_BREAK_OPTIONS}
          value={String(settings.longBreakMinutes)}
          onValueChange={(v) =>
            setSettings({...settings, longBreakMinutes: Number(v) as StudySettings['longBreakMinutes']})
          }
          className="max-w-full flex-wrap"
        />
      </div>

      <p className="font-mono text-caption text-muted">Ciclos: 4 · Descanso corto: 5 min</p>

      <div className="space-y-3 rounded-card border border-rule bg-subtle p-4">
        <Switch
          checked={settings.blindado}
          onCheckedChange={(blindado) => setSettings({...settings, blindado})}
          label="Modo blindado"
          description="Pantalla completa y aviso si cambias de pestaña."
          labelPosition="left"
          className="w-full"
        />
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          aria-expanded={explainOpen}
          aria-controls={explainId}
          onClick={() => setExplainOpen((o) => !o)}
        >
          ¿Cómo funciona?
        </Button>
        {explainOpen ? (
          <div id={explainId}>
            <InlineAlert variant="info">
              Al empezar, la sesión ocupa toda la pantalla y te avisamos con un sonido cada vez que sales de la
              pestaña o de la ventana. Puedes salir cuando quieras con «Salir del modo blindado» o con Escape: nunca bloqueamos el
              teclado.
            </InlineAlert>
          </div>
        ) : null}
      </div>

      <Button variant="primary" size="lg" pill fullWidth leadingIcon={<Icon name="play" className="size-5" />} onClick={start}>
        Empezar sesión
      </Button>
    </Card>

    <aside aria-label="Resumen de la sesión" className="space-y-4">
      <Card className="space-y-3 p-5">
        <h3 className="font-mono text-caption uppercase tracking-widest text-muted">Tu día</h3>
        <p className="text-h2 text-strong">
          {stats.focusMinutesToday} <span className="text-body text-muted">/ {dailyGoal} min de enfoque</span>
        </p>
        <div
          role="progressbar"
          aria-label="Meta diaria de enfoque"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 w-full overflow-hidden rounded-pill border border-rule bg-subtle"
        >
          <div className="h-full bg-primary" style={{width: `${pct}%`}} />
        </div>
      </Card>
      <Card className="space-y-3 p-5">
        <h3 className="font-mono text-caption uppercase tracking-widest text-muted">Qué pasa en la sesión</h3>
        <ol className="list-decimal space-y-2 pl-5 text-small text-default">
          <li>Estudias {settings.studyMinutes} min sin distracciones.</li>
          <li>Descanso corto de 5 min; tras 4 ciclos, descanso largo de {settings.longBreakMinutes} min.</li>
          <li>Al terminar ves un resumen y sumas minutos a tu meta diaria.</li>
        </ol>
      </Card>
    </aside>
    </div>
  );
}
