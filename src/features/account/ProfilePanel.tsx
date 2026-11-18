import {useRef, useState, type ChangeEvent, type FormEvent} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {isSupabaseConfigured} from '../../services/supabaseClient';
import {Avatar, Button, InlineAlert, TextField, useToast} from '../../ui';
import {AVATAR_MAX_INPUT_BYTES, removeAvatar, uploadAvatar} from './avatarUpload';

/** Perfil tab: editable student data. Save stays disabled until something changes. */
export function ProfilePanel() {
  const {studentProfile, handleUpdateProfile, session, profile, avatarUrl, refreshProfile} = useAppState();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const userId = session?.user.id ?? null;
  const canEditPhoto = isSupabaseConfigured && Boolean(userId);

  const onPickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      toast.show({message: 'Elige un archivo de imagen.', variant: 'danger'});
      return;
    }
    if (file.size > AVATAR_MAX_INPUT_BYTES) {
      toast.show({message: 'La imagen supera los 5 MB.', variant: 'danger'});
      return;
    }
    setPhotoBusy(true);
    try {
      await uploadAvatar(userId, file, profile?.avatarUrl ?? null);
      await refreshProfile();
      toast.show({message: 'Foto actualizada', variant: 'success'});
    } catch {
      toast.show({message: 'No pudimos subir la foto. Inténtalo de nuevo.', variant: 'danger'});
    } finally {
      setPhotoBusy(false);
    }
  };

  const onRemovePhoto = async () => {
    if (!userId) return;
    setPhotoBusy(true);
    try {
      await removeAvatar(userId, profile?.avatarUrl ?? null);
      await refreshProfile();
      toast.show({message: 'Foto eliminada', variant: 'success'});
    } catch {
      toast.show({message: 'No pudimos quitar la foto. Inténtalo de nuevo.', variant: 'danger'});
    } finally {
      setPhotoBusy(false);
    }
  };
  const [form, setForm] = useState({
    name: studentProfile.name,
    degree: studentProfile.degree,
    university: studentProfile.university,
    academicTerm: studentProfile.academicTerm,
  });
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const dirty =
    form.name !== studentProfile.name ||
    form.degree !== studentProfile.degree ||
    form.university !== studentProfile.university ||
    form.academicTerm !== studentProfile.academicTerm;

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({...f, [key]: value}));
    setSaved(false);
    if (key === 'name') setNameError(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Escribe tu nombre.');
      return;
    }
    handleUpdateProfile({...studentProfile, ...form, name: form.name.trim()});
    setSaved(true);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-card border border-rule bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <Avatar name={form.name.trim() || 'Estudiante'} src={avatarUrl ?? undefined} size="lg" />
        <div className="min-w-0">
          <p className="font-display text-h3 text-strong">{form.name.trim() || 'Estudiante'}</p>
          <p className="text-small text-muted">{form.degree}</p>
          {canEditPhoto ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-label="Seleccionar foto de perfil"
                onChange={onPickPhoto}
              />
              <Button type="button" variant="secondary" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
                {photoBusy ? 'Subiendo…' : 'Cambiar foto'}
              </Button>
              {profile?.avatarUrl ? (
                <Button type="button" variant="ghost" disabled={photoBusy} onClick={onRemovePhoto}>
                  Quitar foto
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <TextField
        label="Nombre"
        value={form.name}
        error={nameError}
        autoComplete="name"
        onChange={(e) => set('name')(e.target.value)}
      />
      <TextField label="Carrera" value={form.degree} onChange={(e) => set('degree')(e.target.value)} />
      <TextField label="Universidad" value={form.university} onChange={(e) => set('university')(e.target.value)} />
      <TextField
        label="Período académico"
        value={form.academicTerm}
        onChange={(e) => set('academicTerm')(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={!dirty}>
          Guardar
        </Button>
        {saved && !dirty ? (
          <InlineAlert variant="success" live className="flex-1">
            Cambios guardados
          </InlineAlert>
        ) : null}
      </div>
    </form>
  );
}
