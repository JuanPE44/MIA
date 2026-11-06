import {useId, useRef, useState, type FormEvent} from 'react';
import {Button, Dialog, IconPicker, TextField} from '../../ui';
import {FOLDER_COVERS, FOLDER_ICONS} from './libraryModel';

interface NewFolderDialogProps {
  onClose: () => void;
  onCreate: (name: string, icon: string, coverImage?: string) => void;
}

/** Mounted only while open, so its state resets on every open. */
export function NewFolderDialog({onClose, onCreate}: NewFolderDialogProps) {
  const formId = useId();
  const coverName = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(FOLDER_ICONS[0]);
  const [cover, setCover] = useState<string>('');
  const [nameError, setNameError] = useState('');

  const validateName = (value: string) => {
    const message = value.trim() ? '' : 'Escribe un nombre para la carpeta';
    setNameError(message);
    return !message;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateName(name)) {
      nameRef.current?.focus();
      return;
    }
    onCreate(name.trim(), icon, cover || undefined);
    onClose();
  };

  const coverOptions = [{id: '', label: 'Sin portada', src: ''}, ...FOLDER_COVERS.map((c) => ({...c}))];

  return (
    <Dialog
      open
      onClose={onClose}
      title="Nueva carpeta"
      size="md"
      initialFocusRef={nameRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Crear carpeta
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          ref={nameRef}
          label="Nombre (obligatorio)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) validateName(e.target.value);
          }}
          onBlur={(e) => {
            if (nameError || e.target.value) validateName(e.target.value);
          }}
          error={nameError}
          aria-required="true"
          autoComplete="off"
        />
        <IconPicker label="Ícono" icons={FOLDER_ICONS} value={icon} onChange={setIcon} />
        <fieldset>
          <legend className="mb-2 text-label text-strong">Portada (opcional)</legend>
          <div className="flex flex-wrap gap-3">
            {coverOptions.map((c) => {
              const selected = cover === c.src;
              return (
                <label
                  key={c.id || 'none'}
                  className={`relative flex min-h-11 w-32 cursor-pointer flex-col overflow-hidden rounded-control border text-small has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                    selected ? 'border-primary bg-primary-tint' : 'border-hairline bg-surface hover:border-control'
                  }`}
                >
                  <input
                    type="radio"
                    name={coverName}
                    checked={selected}
                    onChange={() => setCover(c.src)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  {c.src ? <img src={c.src} alt="" className="aspect-[16/7] w-full object-cover" /> : null}
                  <span className="px-2 py-2 text-strong">{c.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
