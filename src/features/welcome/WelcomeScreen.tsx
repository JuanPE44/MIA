import {useRef, useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {useTheme, type ThemeMode} from '../../app/providers/ThemeProvider';
import {Button, SegmentedControl} from '../../ui';
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
        <div className="relative w-full max-w-[440px]">
          <div aria-hidden className="absolute inset-0 -z-0 scale-110 rounded-card bg-primary-tint opacity-60 blur-3xl" />
          <div className="relative rounded-card border border-hairline bg-surface p-6 text-center shadow-elevation-2 sm:p-10">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_8.03.54_AM_cb87d5b4.jpeg"
              alt="MIA"
              className="mx-auto size-16 rounded-card object-cover"
            />
            <h1 className="mt-6 text-display text-strong">
              {firstRun ? 'Te damos la bienvenida a MIA' : `¡Hola de nuevo, ${name}!`}
            </h1>
            <p className="mt-3 text-body text-muted">
              Tu copiloto de estudio: ordena tus apuntes, pregúntales lo que necesites y practica con tus propios materiales.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {firstRun ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    pill
                    fullWidth
                    loading={pending === 'nuevo'}
                    disabled={pending === 'frecuente'}
                    onClick={() => enter('nuevo')}
                  >
                    Empezar desde cero
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    pill
                    fullWidth
                    loading={pending === 'frecuente'}
                    disabled={pending === 'nuevo'}
                    onClick={() => enter('frecuente')}
                  >
                    Probar con datos de ejemplo
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  pill
                  fullWidth
                  loading={pending !== null}
                  onClick={() => enter('frecuente')}
                >
                  Empezar
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
