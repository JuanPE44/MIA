import {useId, useState} from 'react';
import {Button, Card, InlineAlert, SegmentedControl, Switch} from '../../ui';
import {useStudySession, type StudySettings} from './StudySessionProvider';
import {Icon} from '../../ui/Icon';

const STUDY_OPTIONS = [20, 25, 30].map((m) => ({value: String(m), label: `${m} min`}));
const LONG_BREAK_OPTIONS = [15, 20, 25, 30].map((m) => ({value: String(m), label: `${m} min`}));

/** S7a: one-step session setup. */
export function SessionSetup() {
  const {settings, setSettings, start} = useStudySession();
  const [explainOpen, setExplainOpen] = useState(false);
  const studyId = useId();
  const longId = useId();
  const explainId = useId();

  return (
    <Card className="mx-auto w-full max-w-narrow space-y-6 p-6">
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
  );
}
