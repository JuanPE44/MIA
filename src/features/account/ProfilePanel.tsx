import {useState, type FormEvent} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {Avatar, Button, InlineAlert, TextField} from '../../ui';

/** Perfil tab: editable student data. Save stays disabled until something changes. */
export function ProfilePanel() {
  const {studentProfile, handleUpdateProfile} = useAppState();
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
        <Avatar name={form.name.trim() || 'Estudiante'} size={64} />
        <div>
          <p className="font-display text-h3 text-strong">{form.name.trim() || 'Estudiante'}</p>
          <p className="text-small text-muted">{form.degree}</p>
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
