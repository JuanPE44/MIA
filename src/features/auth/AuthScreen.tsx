import {useState, type FormEvent} from 'react';
import {useTheme, type ThemeMode} from '../../app/providers/ThemeProvider';
import {isSupabaseConfigured, supabase} from '../../services/supabaseClient';
import {AppMark, Button, Highlight, InlineAlert, Reveal, RevealItem, SegmentedControl, TextField} from '../../ui';
import {Icon} from '../../ui/Icon';
import {paths} from '../../app/routes';
import {AuthShowcase} from './AuthShowcase';

type Mode = 'signin' | 'signup' | 'reset';

const THEME_OPTIONS = [
  {value: 'light' as const, label: <span className="sr-only">Claro</span>, icon: <Icon name="theme-light" className="size-4" />},
  {value: 'dark' as const, label: <span className="sr-only">Oscuro</span>, icon: <Icon name="theme-dark" className="size-4" />},
  {value: 'system' as const, label: <span className="sr-only">Sistema</span>, icon: <Icon name="theme-system" className="size-4" />},
];

const MODE_OPTIONS = [
  {value: 'signin' as const, label: 'Ingresar'},
  {value: 'signup' as const, label: 'Crear cuenta'},
];

const MIN_PASSWORD = 6;

const callbackUrl = () => `${window.location.origin}${paths.authCallback()}`;

/** Maps Supabase auth errors to neutral Spanish copy. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'El correo o la contraseña no son correctos.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese correo.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Hiciste demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (m.includes('password') && m.includes('characters')) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (m.includes('failed to fetch') || m.includes('network')) return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}

/**
 * Entry screen while there is no session (rendered at any URL): email + password
 * (sign in / sign up), Google and password reset, all through Supabase Auth.
 */
export function AuthScreen() {
  const {mode: themeMode, setMode: setThemeMode} = useTheme();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<{email?: boolean; password?: boolean}>({});

  const errors: {email?: string; password?: string} = {};
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Escribe un correo válido.';
  if (mode !== 'reset' && password.length < MIN_PASSWORD) errors.password = `Usa al menos ${MIN_PASSWORD} caracteres.`;
  const fieldErrors = {
    email: submitted || touched.email ? errors.email : undefined,
    password: submitted || touched.password ? errors.password : undefined,
  };
  const markTouched = (field: 'email' | 'password') => () => setTouched((t) => ({...t, [field]: true}));

  const changeMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setSubmitted(false);
    setTouched({});
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setError(null);
    setNotice(null);
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const cleanEmail = email.trim();
      if (mode === 'signin') {
        const {error: err} = await supabase.auth.signInWithPassword({email: cleanEmail, password});
        if (err) setError(friendlyError(err.message));
      } else if (mode === 'signup') {
        const {data, error: err} = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {emailRedirectTo: callbackUrl(), data: name.trim() ? {full_name: name.trim()} : undefined},
        });
        if (err) setError(friendlyError(err.message));
        else if (!data.session) setNotice('Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve para ingresar.');
      } else {
        const {error: err} = await supabase.auth.resetPasswordForEmail(cleanEmail, {redirectTo: callbackUrl()});
        if (err) setError(friendlyError(err.message));
        else setNotice('Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva.');
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ''));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (!supabase || busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    const {error: err} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: callbackUrl()},
    });
    if (err) {
      setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
      setBusy(false);
    }
  };

  const heading =
    mode === 'signup' ? 'Crea tu cuenta' : mode === 'reset' ? 'Recupera tu contraseña' : 'Ingresa a tu cuenta';

  return (
    <div className="min-h-dvh overflow-x-hidden bg-page text-strong lg:grid lg:grid-cols-2">
      <AuthShowcase />

      <div className="flex min-h-dvh min-w-0 flex-col px-4 py-4 sm:px-6">
        {/* In flow (not absolutely positioned) so it can never overlap the heading on small screens */}
        <div className="flex justify-end">
          <SegmentedControl<ThemeMode>
            aria-label="Tema"
            value={themeMode}
            onValueChange={setThemeMode}
            options={THEME_OPTIONS}
          />
        </div>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-6 py-8">
        <Reveal className="flex flex-col gap-6" stagger={0.1}>
          <RevealItem>
            <div className="flex items-center justify-center gap-3">
              <AppMark size={40} />
              <h1 className="font-display text-h1 text-strong">
                Bienvenida a <Highlight trigger="mount" delay={0.5}>MIA</Highlight>
              </h1>
            </div>
            <p className="mt-3 text-center text-body text-muted">Tu copiloto de estudio.</p>
          </RevealItem>

          <RevealItem>
            <div className="rounded-card border border-rule bg-surface-raised p-5 shadow-elevation-1 sm:p-8">
              {!isSupabaseConfigured ? (
                <InlineAlert variant="warning">
                  Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local y
                  reinicia el servidor para poder ingresar.
                </InlineAlert>
              ) : (
                <div className="flex flex-col gap-5">
                  {mode !== 'reset' ? (
                    <SegmentedControl<'signin' | 'signup'>
                      aria-label="Ingresar o crear cuenta"
                      value={mode}
                      onValueChange={changeMode}
                      options={MODE_OPTIONS}
                      fullWidth
                    />
                  ) : null}

                  <h2 className="font-display text-h2 text-strong">{heading}</h2>

                  <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                    {mode === 'signup' ? (
                      <TextField
                        label="Nombre (opcional)"
                        value={name}
                        autoComplete="name"
                        onChange={(e) => setName(e.target.value)}
                      />
                    ) : null}
                    <TextField
                      label="Correo"
                      type="email"
                      value={email}
                      autoComplete="email"
                      error={fieldErrors.email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={markTouched('email')}
                    />
                    {mode !== 'reset' ? (
                      <TextField
                        label="Contraseña"
                        type="password"
                        value={password}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        error={fieldErrors.password}
                        helper={mode === 'signup' ? `Mínimo ${MIN_PASSWORD} caracteres.` : undefined}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={markTouched('password')}
                        labelAction={
                          mode === 'signin' ? (
                            <button
                              type="button"
                              className="cursor-pointer text-small text-muted underline-offset-2 hover:text-strong hover:underline"
                              onClick={() => changeMode('reset')}
                            >
                              ¿Olvidaste tu contraseña?
                            </button>
                          ) : undefined
                        }
                      />
                    ) : null}

                    {error ? (
                      <InlineAlert variant="danger" live>
                        {error}
                      </InlineAlert>
                    ) : null}
                    {notice ? (
                      <InlineAlert variant="success" live>
                        {notice}
                      </InlineAlert>
                    ) : null}

                    <Button type="submit" variant="primary" size="lg" pill fullWidth loading={busy}>
                      {mode === 'signin' ? 'Ingresar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
                    </Button>
                  </form>

                  {mode === 'reset' ? (
                    <div className="flex justify-center">
                      <Button variant="ghost" onClick={() => changeMode('signin')}>
                        Volver a ingresar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-small text-muted" role="separator">
                        <span className="h-px flex-1 bg-rule" />
                        o
                        <span className="h-px flex-1 bg-rule" />
                      </div>
                      <Button
                        variant="secondary"
                        fullWidth
                        disabled={busy}
                        leadingIcon={<Icon name="google" className="size-5" />}
                        onClick={onGoogle}
                      >
                        Continuar con Google
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </RevealItem>
        </Reveal>
      </main>
      </div>
    </div>
  );
}
