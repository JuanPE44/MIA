import {useRef, useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {useTheme, type ThemeMode} from '../../app/providers/ThemeProvider';
import {Button, Highlight, Reveal, RevealItem, SegmentedControl, SelectableCard, Spinner} from '../../ui';
import type {UserType} from '../../types';
import {Icon} from '../../ui/Icon';

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
              className="size-14 rounded-card border border-rule object-cover"
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
              <div role="radiogroup" aria-label="Cómo quieres empezar" className="grid gap-4 sm:grid-cols-2">
                <SelectableCard
                  name="user-type"
                  value="nuevo"
                  icon="add"
                  iconSlot={pending === 'nuevo' ? <Spinner /> : undefined}
                  title="Empezar desde cero"
                  description="Una biblioteca vacía para armar tus propios cuadernos."
                  selected={pending === 'nuevo'}
                  disabled={pending === 'frecuente'}
                  aria-busy={pending === 'nuevo' || undefined}
                  onSelect={() => enter('nuevo')}
                />
                <SelectableCard
                  name="user-type"
                  value="frecuente"
                  icon="notebook"
                  iconSlot={pending === 'frecuente' ? <Spinner /> : undefined}
                  title="Probar con datos de ejemplo"
                  description="Cuadernos, fuentes y progreso de muestra para explorar."
                  selected={pending === 'frecuente'}
                  disabled={pending === 'nuevo'}
                  aria-busy={pending === 'frecuente' || undefined}
                  onSelect={() => enter('frecuente')}
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
