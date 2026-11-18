import {useEffect, useState, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import {supabase} from '../../services/supabaseClient';
import {Button, InlineAlert, Spinner, TextField, useToast} from '../../ui';

/** Reads `error_description` from the callback URL (query or hash), if Supabase reported one. */
function callbackError(): string | null {
  const read = (raw: string) => new URLSearchParams(raw.replace(/^[?#]/, '')).get('error_description');
  return read(window.location.search) || read(window.location.hash);
}

/**
 * `/auth/callback`: landing page for Google OAuth, email confirmation and
 * password recovery. supabase-js exchanges the URL credentials automatically;
 * this screen waits for the session, then continues to the library.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const {session, authReady, isPasswordRecovery, clearPasswordRecovery} = useAppState();
  const [error] = useState(callbackError);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (session && !isPasswordRecovery) navigate(paths.notebooks(), {replace: true});
  }, [session, isPasswordRecovery, navigate]);

  const onNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || saving) return;
    if (password.length < 6) {
      setFormError('Usa al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    const {error: err} = await supabase.auth.updateUser({password});
    setSaving(false);
    if (err) {
      setFormError('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      return;
    }
    clearPasswordRecovery();
    toast.show({variant: 'success', message: 'Contraseña actualizada.'});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 text-strong">
      <div className="flex w-full max-w-narrow flex-col gap-5">
        {isPasswordRecovery && session ? (
          <form onSubmit={onNewPassword} noValidate className="flex flex-col gap-4">
            <h1 className="font-display text-h2 text-strong">Crea una contraseña nueva</h1>
            <TextField
              label="Contraseña nueva"
              type="password"
              value={password}
              autoComplete="new-password"
              error={formError}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError(null);
              }}
            />
            <Button type="submit" variant="primary" loading={saving}>
              Guardar contraseña
            </Button>
          </form>
        ) : error || (authReady && !session) ? (
          <>
            <InlineAlert variant="danger" live>
              {error ?? 'No pudimos completar el ingreso. El enlace puede haber expirado.'}
            </InlineAlert>
            <Link to={paths.login()} className="text-label text-strong underline">
              Volver a ingresar
            </Link>
          </>
        ) : (
          <div role="status" className="flex items-center gap-3 text-body text-muted">
            <Spinner /> Verificando tu cuenta…
          </div>
        )}
      </div>
    </div>
  );
}
