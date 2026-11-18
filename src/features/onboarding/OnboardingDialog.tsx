import {useId, useState, type FormEvent} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {GOAL_OPTIONS, useDailyGoal} from '../progress/dailyGoal';
import {Button, Chip, Dialog, PageTransition, SegmentedControl, TextField} from '../../ui';
import {cx} from '../../ui/internal/cx';

const STEPS = [
  {title: 'Te damos la bienvenida a MIA', description: 'Empecemos por conocerte. Solo toma un minuto.'},
  {title: '¿Qué estás estudiando ahora?', description: 'Tu materia principal. Puedes cambiarla cuando quieras.'},
  {title: '¿Cuánto quieres estudiar por día?', description: 'Es tu meta diaria. Te ayudamos a mantener la racha.'},
] as const;

const SUBJECT_SUGGESTIONS = ['Emprendimiento', 'Economía', 'Biología', 'Historia', 'Programación'];

/** Three-step welcome for new accounts. Mounted only while open (state resets per open). */
export function OnboardingDialog() {
  const {isOnboardingOpen, studentProfile, handleCompleteOnboarding, handleSkipOnboarding} = useAppState();
  if (!isOnboardingOpen) return null;
  return (
    <OnboardingSteps
      initialName={studentProfile.name}
      onComplete={handleCompleteOnboarding}
      onSkip={handleSkipOnboarding}
    />
  );
}

interface StepsProps {
  initialName: string;
  onComplete: (answers: {name: string; mainSubject: string; dailyGoalMinutes: number}) => void;
  onSkip: () => void;
}

function OnboardingSteps({initialName, onComplete, onSkip}: StepsProps) {
  const formId = useId();
  const [currentGoal] = useDailyGoal();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState(String(currentGoal));
  const last = step === STEPS.length - 1;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    onComplete({name, mainSubject: subject, dailyGoalMinutes: Number(goal)});
  };

  return (
    <Dialog
      open
      size="md"
      onClose={onSkip}
      dismissible={false}
      hideCloseButton
      title={STEPS[step].title}
      description={STEPS[step].description}
      footer={
        <>
          <Button variant="ghost" className="sm:mr-auto" onClick={onSkip}>
            Saltar
          </Button>
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
          ) : null}
          <Button type="submit" form={formId} variant="primary">
            {last ? 'Crear mi cuaderno de ejemplo' : 'Siguiente'}
          </Button>
        </>
      }
    >
      <div
        role="img"
        aria-label={`Paso ${step + 1} de ${STEPS.length}`}
        className="mb-5 flex items-center gap-2"
      >
        {STEPS.map((s, i) => (
          <span
            key={s.title}
            aria-hidden
            className={cx(
              'h-2 flex-1 rounded-pill border transition-colors duration-[var(--mia-duration-menu)]',
              i <= step ? 'border-ink bg-highlight' : 'border-rule bg-subtle',
            )}
          />
        ))}
      </div>

      <form id={formId} onSubmit={submit} noValidate className="min-h-40">
        <PageTransition transitionKey={String(step)}>
          {step === 0 ? (
            <TextField
              label="Tu nombre"
              value={name}
              autoComplete="given-name"
              autoFocus
              onChange={(e) => setName(e.target.value)}
              helper="Así te saludamos dentro de la app."
            />
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-3">
              <TextField
                label="Materia principal"
                value={subject}
                autoFocus
                placeholder="Por ejemplo: Emprendimiento"
                onChange={(e) => setSubject(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {SUBJECT_SUGGESTIONS.map((s) => (
                  <Chip key={s} variant="selectable" selected={subject === s} onSelectedChange={() => setSubject(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-4">
              <SegmentedControl<string>
                aria-label="Meta diaria en minutos"
                value={goal}
                onValueChange={setGoal}
                options={GOAL_OPTIONS.map((g) => ({value: String(g), label: `${g} min`}))}
                fullWidth
              />
              <p className="text-small text-muted">
                Además, te armamos un cuaderno de ejemplo con fuentes ya cargadas para que pruebes el chat y los
                materiales.
              </p>
            </div>
          ) : null}
        </PageTransition>
      </form>
    </Dialog>
  );
}
