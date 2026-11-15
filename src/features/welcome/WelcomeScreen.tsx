import {useRef, useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {useTheme, type ThemeMode} from '../../app/providers/ThemeProvider';
import {Button, Highlight, Reveal, RevealItem, SegmentedControl, Spinner} from '../../ui';
import type {UserType} from '../../types';
import {Icon, type IconName} from '../../ui/Icon';

const NOTEBOOKS_KEY = 'focused_notebooks_frecuente_v2';
const LOADING_MS = 250;

/** First run = nothing persisted yet (the user never entered with example data). */
function readIsFirstRun(): boolean {
  try {
    return localStorage.getItem(NOTEBOOKS_KEY) === null;
  } catch {
    return true;
  }
}

const THEME_OPTIONS = [
  {value: 'light' as const, label: <span className="sr-only">Claro</span>, icon: <Icon name="theme-light" className="size-4" />},
  {value: 'dark' as const, label: <span className="sr-only">Oscuro</span>, icon: <Icon name="theme-dark" className="size-4" />},
  {value: 'system' as const, label: <span className="sr-only">Sistema</span>, icon: <Icon name="theme-system" className="size-4" />},
];

/**
 * Bienvenida (S1). Rendered by `App` while there is no session, at ANY URL, so
 * after entering the requested screen shows (reload returns here, no session persistence).
 */
export function WelcomeScreen() {
  const {handleLoginSuccess, studentProfile} = useAppState();
  const {mode, setMode} = useTheme();
  // Evaluated once: persistence effects write the key later in the same visit.
  const [firstRun] = useState(readIsFirstRun);
  const [pending, setPending] = useState<UserType | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const name = studentProfile?.name?.trim() || 'Juan';

  const enter = (type: UserType) => {
    if (pending) return;
    setPending(type);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => handleLoginSuccess(name, type), LOADING_MS);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page px-4 py-4 text-strong sm:px-6">
      <div className="flex justify-end">
        <SegmentedControl<ThemeMode>
          aria-label="Tema"
          value={mode}
          onValueChange={setMode}
          options={THEME_OPTIONS}
        />
      </div>

      <main className="flex flex-1 items-center justify-center py-8">
        <Reveal className="flex w-full max-w-reading flex-col gap-8" stagger={0.1}>
          <RevealItem>
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_8.03.54_AM_cb87d5b4.jpeg"
              alt="MIA"
              className="size-14 rounded-card border border-ink object-cover shadow-offset"
            />
          </RevealItem>
          <RevealItem>
            <h1 className="text-display text-strong">
              {firstRun ? (
                <>
                  Te damos la bienvenida a <Highlight trigger="mount" delay={0.5}>MIA</Highlight>
                </>
              ) : (
                <>
                  Hola de nuevo, <Highlight trigger="mount" delay={0.5}>{name}</Highlight>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-narrow text-body text-muted">
              Tu copiloto de estudio: ordena tus apuntes, pregúntales lo que necesites y practica con tus propios materiales.
            </p>
          </RevealItem>

          <RevealItem>
            {firstRun ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <ChoiceCard
                  icon="add"
                  title="Empezar desde cero"
                  description="Una biblioteca vacía para armar tus propios cuadernos."
                  loading={pending === 'nuevo'}
                  disabled={pending === 'frecuente'}
                  onClick={() => enter('nuevo')}
                />
                <ChoiceCard
                  icon="notebook"
                  title="Probar con datos de ejemplo"
                  description="Cuadernos, fuentes y progreso de muestra para explorar."
                  loading={pending === 'frecuente'}
                  disabled={pending === 'nuevo'}
                  onClick={() => enter('frecuente')}
                />
              </div>
            ) : (
              <Button variant="primary" size="lg" pill loading={pending !== null} onClick={() => enter('frecuente')}>
                Empezar
              </Button>
            )}
          </RevealItem>
        </Reveal>
      </main>
    </div>
  );
}

interface ChoiceCardProps {
  icon: IconName;
  title: string;
  description: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** User-type choice: a whole-card button with ink border and hard offset on hover. */
function ChoiceCard({icon, title, description, loading, disabled, onClick}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className="flex flex-col items-start gap-3 rounded-card border border-rule bg-surface p-5 text-left outline-none transition-[box-shadow,border-color,translate] duration-[120ms] hover:-translate-x-px hover:-translate-y-px hover:border-ink hover:shadow-offset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-tile-azul">
        {loading ? <Spinner /> : <Icon name={icon} weight="duotone" className="size-6 text-ink" />}
      </span>
      <span className="font-display text-h3 text-strong">{title}</span>
      <span className="text-small text-muted">{description}</span>
    </button>
  );
}
