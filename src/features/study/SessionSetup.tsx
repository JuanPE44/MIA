import {useId, useState} from 'react';
import {Play} from 'lucide-react';
import {Button, Card, InlineAlert, SegmentedControl, Switch} from '../../ui';
import {useStudySession, type StudySettings} from './StudySessionProvider';

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
    <Card className="mx-auto w-full max-w-[560px] space-y-6 p-6">
      <h2 className="text-h2 text-strong">Sesión de estudio</h2>

      <div className="space-y-2">
        <p id={studyId} className="text-label text-strong">
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
        <p id={longId} className="text-label text-strong">
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

      <p className="text-small text-muted">Ciclos: 4 · Descanso corto: 5 min</p>

      <div className="space-y-3 rounded-card border border-hairline p-4">
        <Switch
          checked={settings.blindado}
          onCheckedChange={(blindado) => setSettings({...settings, blindado})}
          label="Modo blindado"
          description="Pantalla completa y aviso si cambias de pestaña."
          labelPosition="left"
          className="w-full"
        />
        <button
          type="button"
          aria-expanded={explainOpen}
          aria-controls={explainId}
          onClick={() => setExplainOpen((o) => !o)}
          className="min-h-touch text-label text-primary-text underline-offset-2 hover:underline"
        >
          ¿Cómo funciona?
        </button>
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

      <Button variant="primary" size="lg" pill fullWidth leadingIcon={<Play aria-hidden className="size-5" />} onClick={start}>
        Empezar sesión
      </Button>
    </Card>
  );
}
