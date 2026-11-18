import {useId, useRef, useState, type FormEvent} from 'react';
import {Button, Dialog, IconPicker, TextField} from '../../ui';
import {FolderCoverPicker} from './FolderCoverPicker';
import {FOLDER_ICONS} from './libraryModel';

interface NewFolderDialogProps {
  onClose: () => void;
  onCreate: (name: string, icon: string, coverImage?: string) => void;
}

/** Mounted only while open, so its state resets on every open. */
export function NewFolderDialog({onClose, onCreate}: NewFolderDialogProps) {
  const formId = useId();
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
        <FolderCoverPicker value={cover} onChange={setCover} />
      </form>
    </Dialog>
  );
}
